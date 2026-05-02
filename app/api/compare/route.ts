export const maxDuration = 60

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductsByIds } from '@/lib/gear'
import { anthropic, buildComparisonPrompt } from '@/lib/anthropic'
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

    // Cross-field: combined product count must be 2-4
    const totalProducts = productIds.length + externalProducts.length
    if (totalProducts < 2 || totalProducts > 4) {
      return Response.json(
        { error: 'Select 2 to 4 products total to compare', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // 2. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    // 3. Pro gate — hard block, no free tier for comparison
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const isPro = subscription?.plan === 'pro' && subscription?.status === 'active'
    if (!isPro) {
      return Response.json(
        { error: 'Comparison is a Pro feature. Upgrade to Pro for unlimited comparisons.', code: 'PRO_REQUIRED' },
        { status: 403 }
      )
    }

    // 3b. Usage cap checks for Pro
    const period = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    const today = new Date().toISOString().split('T')[0]  // 'YYYY-MM-DD'

    const [monthlyUsage, dailyUsage] = await Promise.all([
      supabase
        .from('usage_counters')
        .select('comp_count')
        .eq('user_id', user.id)
        .eq('period', period)
        .single(),
      supabase
        .from('usage_counters')
        .select('comp_count')
        .eq('user_id', user.id)
        .eq('period', today)
        .single(),
    ])

    const monthlyCompCount = monthlyUsage.data?.comp_count ?? 0
    const dailyCompCount = dailyUsage.data?.comp_count ?? 0

    if (dailyCompCount >= 10) {
      return Response.json(
        { error: 'You\'ve reached your 10 comparisons for today. Your daily limit resets at midnight.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }
    if (monthlyCompCount >= 50) {
      return Response.json(
        { error: 'You\'ve reached your 50 comparisons this month. Your limit resets on the 1st.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }

    // 4. Fetch athlete profile
    const { data: profile, error: profileError } = await supabase
      .from('athlete_profiles')
      .select(
        'id, user_id, race_distances, experience_level, background_sport, gender, date_of_birth, country, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, race_id, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'Athlete profile not found. Please complete your profile first.', code: 'PROFILE_NOT_FOUND' }, { status: 400 })
    }

    // 5. Fetch layer2 context if recommendationId provided
    let layer2Responses: Record<string, unknown> | null = null
    let originalTopPickId: string | undefined

    if (recommendationId) {
      const [responsesResult, recResult] = await Promise.all([
        supabase
          .from('category_responses')
          .select('responses')
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
      }
      if (recResult.data?.top_pick_product_id) {
        originalTopPickId = recResult.data.top_pick_product_id
      }
    }

    // 6. Fetch DB products and validate they belong to this category
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
          return Response.json(
            { error: `Product "${wrongCategory.name}" does not belong to this category`, code: 'CATEGORY_MISMATCH' },
            { status: 400 }
          )
        }
      }
    }

    // Check all requested DB products were found
    if (dbProducts.length !== productIds.length) {
      return Response.json(
        { error: 'One or more products not found or not active', code: 'NOT_FOUND' },
        { status: 400 }
      )
    }

    // 7. Fetch category id for saving
    const { data: category } = await supabase
      .from('gear_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!category) {
      return Response.json({ error: 'Category not found', code: 'NOT_FOUND' }, { status: 400 })
    }

    // 8. Build prompt
    const prompt = buildComparisonPrompt({
      profile: profile as AthleteProfile,
      layer2Responses,
      dbProducts,
      externalProducts,
      categorySlug,
      originalTopPickId,
    })

    // 9. Call Anthropic with streaming
    let streamResponse: ReturnType<typeof anthropic.messages.stream>
    try {
      streamResponse = anthropic.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
    } catch (err) {
      console.error('[compare] Anthropic stream init error:', err)
      return Response.json(
        { error: 'Failed to start comparison. Please try again.', code: 'AI_ERROR' },
        { status: 500 }
      )
    }

    // 10. Return streaming response, accumulate full text
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
              return
            }

            // Honor pre-generated ID from client header if present
            const compId = request.headers.get('X-Comparison-Id') ?? crypto.randomUUID()

            // Use service-role client — gear_comparisons INSERT is server-trusted
            const adminDb = createAdminClient()

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

            // Increment both daily and monthly comparison counters
            await Promise.all([
              supabase.rpc('increment_usage_counter', {
                p_user_id: user.id,
                p_period: period,
                p_rec_count: 0,
                p_comp_count: 1,
              }),
              supabase.rpc('increment_usage_counter', {
                p_user_id: user.id,
                p_period: today,
                p_rec_count: 0,
                p_comp_count: 1,
              }),
            ])
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
