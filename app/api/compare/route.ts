export const maxDuration = 60

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductsByIds } from '@/lib/gear'
import { anthropic, buildComparisonPrompt, TAPR_SYSTEM_PROMPT, TAPR_MODEL } from '@/lib/anthropic'
import type { AthleteProfile } from '@/types/profile'
import type { ComparisonResult } from '@/types/comparison'

const bodySchema = z.object({
  categorySlug: z.string().min(1),
  productIds: z.array(z.string().uuid()).min(0).max(4).default([]),
  externalProducts: z.array(z.string().min(1).max(100)).max(4).default([]),
  recommendationId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { categorySlug, productIds, externalProducts, recommendationId } = parsed.data

    // 2. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    // 3. Validate product count (hard cap: 4 max regardless of anything)
    const totalProducts = productIds.length + externalProducts.length
    if (totalProducts < 2) {
      return Response.json({ error: 'At least 2 products required for comparison', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (totalProducts > 4) {
      return Response.json({ error: 'Maximum 4 products per comparison', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 4. Fetch layer2 context if recommendationId provided (needed to determine isQuickCompare before credit deduction)
    let layer2Responses: Record<string, unknown> | null = null
    let originalTopPickId: string | undefined
    let recBudgetMin: number | undefined
    let recBudgetMax: number | undefined

    if (recommendationId) {
      const [responsesResult, recResult] = await Promise.all([
        supabase
          .from('category_responses')
          .select('responses, budget_min_usd, budget_max_usd')
          .eq('recommendation_id', recommendationId)
          .single(),
        supabase
          .from('gear_recommendations')
          .select('top_pick_product_id')
          .eq('id', recommendationId)
          .eq('user_id', user.id)
          .single(),
      ])

      if (responsesResult.data) {
        layer2Responses = responsesResult.data.responses as Record<string, unknown>
        recBudgetMin = responsesResult.data.budget_min_usd ?? undefined
        recBudgetMax = responsesResult.data.budget_max_usd ?? undefined
      }
      if (recResult.data?.top_pick_product_id) {
        originalTopPickId = recResult.data.top_pick_product_id
      }
    }

    // 5. Compute quick compare flag and credit cost
    const isQuickCompare =
      !!recommendationId &&
      !!originalTopPickId &&
      totalProducts === 2 &&
      productIds.includes(originalTopPickId)

    const creditCost = isQuickCompare ? 0 : (totalProducts <= 2 ? 1 : 2)

    // 6. Deduct credits atomically before calling Claude (skip if free quick compare)
    if (creditCost > 0) {
      const { data: deducted, error: deductErr } = await adminDb.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: creditCost,
        p_reason: creditCost === 1 ? (isQuickCompare ? 'quick_compare_3' : 'comparison_2') : (isQuickCompare ? 'quick_compare_4' : 'comparison_3_4'),
      })
      if (deductErr || !deducted) {
        return Response.json(
          { error: "You've used all your credits. Buy a credit pack to continue.", code: 'INSUFFICIENT_CREDITS' },
          { status: 402 }
        )
      }
    }

    // Refund deducted credits if comparison generation fails after this point.
    // No-op for free quick-compares (creditCost === 0). Logs loudly if the refund
    // itself fails so it can be reconciled from credit_transactions.
    const refundCredits = async () => {
      if (creditCost <= 0) return
      const { error: refundErr } = await adminDb.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: creditCost,
        p_reason: 'refund_comparison',
      })
      if (refundErr) console.error('[compare] REFUND FAILED — user short', creditCost, 'credit(s):', user.id, refundErr.message)
    }

    // 7. Fetch athlete profile
    const { data: profile, error: profileError } = await supabase
      .from('athlete_profiles')
      .select(
        'id, user_id, sports, current_focus_sport, country, race_distances, experience_level, background_sport, gender, date_of_birth, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, race_id, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      await refundCredits()
      return Response.json({ error: 'Athlete profile not found. Please complete your profile first.', code: 'PROFILE_NOT_FOUND' }, { status: 400 })
    }

    // 8. Fetch DB products and validate they belong to this category
    const dbProducts = await getProductsByIds(productIds)

    // Validate category membership for DB products
    if (productIds.length > 0) {
      const { data: categoryRow } = await supabase
        .from('gear_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (categoryRow) {
        const wrongCategory = dbProducts.find((p) => p.category_id !== categoryRow.id)
        if (wrongCategory) {
          await refundCredits()
          return Response.json(
            { error: `Product "${wrongCategory.name}" does not belong to this category`, code: 'CATEGORY_MISMATCH' },
            { status: 400 }
          )
        }
      }
    }

    // Check all requested DB products were found
    if (dbProducts.length !== productIds.length) {
      await refundCredits()
      return Response.json(
        { error: 'One or more products not found or not active', code: 'NOT_FOUND' },
        { status: 400 }
      )
    }

    // 9. Fetch category id for saving
    const { data: category } = await supabase
      .from('gear_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!category) {
      await refundCredits()
      return Response.json({ error: 'Category not found', code: 'NOT_FOUND' }, { status: 400 })
    }

    // 10. Build prompt
    const prompt = buildComparisonPrompt({
      profile: profile as AthleteProfile,
      layer2Responses,
      dbProducts,
      externalProducts,
      categorySlug,
      originalTopPickId,
      budgetMin: recBudgetMin,
      budgetMax: recBudgetMax,
    })

    // 11. Call Anthropic with streaming
    let streamResponse: ReturnType<typeof anthropic.messages.stream>
    try {
      streamResponse = anthropic.messages.stream({
        model: TAPR_MODEL,
        max_tokens: 6144,
        system: TAPR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })
    } catch (err) {
      console.error('[compare] Anthropic stream init error:', err)
      await refundCredits()
      return Response.json(
        { error: 'Failed to start comparison. Please try again.', code: 'AI_ERROR' },
        { status: 500 }
      )
    }

    // 12. Return streaming response, accumulate full text
    const encoder = new TextEncoder()
    let accumulatedText = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              accumulatedText += text
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (err) {
          console.error('[compare] stream read error:', err)
          await refundCredits()
          // Enqueue a sentinel so the client receives a proper error message
          // rather than a browser-level NetworkError from controller.error()
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`__STREAM_ERROR__:${msg}`))
          controller.close()
          return
        }

        // Append URL map built from dbProducts review sources — more reliable than
        // asking Claude to extract URLs from its own output
        const sourceUrlMap: Record<string, string> = {}
        for (const product of dbProducts) {
          for (const source of (product.review_sources ?? [])) {
            if (source.source_name && source.source_url) {
              sourceUrlMap[source.source_name] = source.source_url
            }
          }
        }
        if (Object.keys(sourceUrlMap).length > 0) {
          controller.enqueue(encoder.encode(`\n__SOURCE_URLS__:${JSON.stringify(sourceUrlMap)}`))
        }

        controller.close()

        // Background save — do not await, do not block stream close
        void (async () => {
          try {
            let result: ComparisonResult
            try {
              const stripped = accumulatedText.replace(/\n__SOURCE_URLS__:\{.*\}$/, '')
              const jsonText = stripped.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
              result = JSON.parse(jsonText) as ComparisonResult
            } catch (parseErr) {
              console.error('[compare] failed to parse Claude response:', parseErr)
              await refundCredits()
              return
            }

            // Honor pre-generated ID from client header if present
            const compId = request.headers.get('X-Comparison-Id') ?? crypto.randomUUID()

            const { error: saveError } = await adminDb
              .from('gear_comparisons')
              .insert({
                id: compId,
                user_id: user.id,
                recommendation_id: recommendationId ?? null,
                category_id: category.id,
                product_ids: productIds,
                external_products: externalProducts,
                winner_product_id: result.verdict.winnerProductId ?? null,
                winner_product_name: result.verdict.winnerProductName,
                comparison_json: result,
                profile_snapshot: profile,
              })

            if (saveError) {
              console.error('[compare] failed to save comparison:', saveError.message)
            }
          } catch (bgErr) {
            console.error('[compare] background save error:', bgErr)
          }
        })()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[compare]', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
