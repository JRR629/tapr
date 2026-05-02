import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductsWithReviewsForRecommendation } from '@/lib/gear'
import { anthropic, buildRecommendationPrompt } from '@/lib/anthropic'
import type { AthleteProfile } from '@/types/profile'
import type { RecommendationResult } from '@/types/recommendation'

const bodySchema = z.object({
  categorySlug: z.string().min(1),
  layer2Responses: z.record(z.string(), z.unknown()),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().positive(),
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

    const { categorySlug, layer2Responses, budgetMin, budgetMax } = parsed.data

    // 2. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    // 3. Check subscription and monthly usage limit
    const period = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

    const [subscriptionResult, usageResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('usage_counters')
        .select('rec_count')
        .eq('user_id', user.id)
        .eq('period', period)
        .single(),
    ])

    const isPro = subscriptionResult.data?.plan === 'pro' && subscriptionResult.data?.status === 'active'
    const recCount = usageResult.data?.rec_count ?? 0

    if (!isPro) {
      // Daily cap: 3 per day
      if (recCount >= 3) {
        return Response.json(
          { error: 'You\'ve used all 3 free recommendations today. Upgrade to Pro for unlimited.', code: 'RATE_LIMITED' },
          { status: 429 }
        )
      }
      // Monthly hard cap: 30 per calendar month (abuse/bot protection)
      const monthPeriod = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
      const { data: monthlyRows } = await supabase
        .from('usage_counters')
        .select('rec_count')
        .eq('user_id', user.id)
        .like('period', `${monthPeriod}-%`)
      const monthlyTotal = (monthlyRows ?? []).reduce((sum, row) => sum + (row.rec_count ?? 0), 0)
      if (monthlyTotal >= 30) {
        return Response.json(
          { error: 'You\'ve reached your 30 free recommendations this month. Upgrade to Pro for unlimited.', code: 'RATE_LIMITED' },
          { status: 429 }
        )
      }
    }

    // 4. Fetch athlete profile
    const { data: profile, error: profileError } = await supabase
      .from('athlete_profiles')
      .select(
        'id, user_id, race_distances, experience_level, background_sport, gender, date_of_birth, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, race_id, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'Athlete profile not found. Please complete your profile first.', code: 'PROFILE_NOT_FOUND' }, { status: 400 })
    }

    // 5. Fetch active products in budget range
    const products = await getProductsWithReviewsForRecommendation(categorySlug, budgetMin, budgetMax)
    if (products.length === 0) {
      return Response.json(
        { error: 'No products found in this category within your budget range.', code: 'NO_PRODUCTS' },
        { status: 400 }
      )
    }

    // 6. Fetch category id for saving
    const { data: category, error: categoryError } = await supabase
      .from('gear_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (categoryError || !category) {
      return Response.json({ error: 'Category not found', code: 'NOT_FOUND' }, { status: 400 })
    }

    // 7. Build prompt
    const prompt = buildRecommendationPrompt({
      profile: profile as AthleteProfile,
      layer2Responses: layer2Responses as Record<string, string | string[] | number | boolean>,
      products,
      budgetMin,
      budgetMax,
      categorySlug,
    })

    // 8. Call Anthropic with streaming
    let streamResponse: ReturnType<typeof anthropic.messages.stream>
    try {
      streamResponse = anthropic.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
    } catch (err) {
      console.error('[recommend] Anthropic stream init error:', err)
      return Response.json(
        { error: 'Failed to start AI recommendation. Please try again.', code: 'AI_ERROR' },
        { status: 500 }
      )
    }

    // 9. Return a streaming response, accumulate full text
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
          console.error('[recommend] stream read error:', err)
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`__STREAM_ERROR__:${msg}`))
          controller.close()
          return
        }

        // Append URL map built from products review sources — more reliable than
        // asking Claude to extract URLs from its own output
        const sourceUrlMap: Record<string, string> = {}
        for (const product of products) {
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

        // 10. Background save — do not await, do not block stream close
        void (async () => {
          try {
            // Parse Claude response
            let result: RecommendationResult
            try {
              // Strip URL map sentinel and markdown code fences if present
              const stripped = accumulatedText.replace(/\n__SOURCE_URLS__:\{.*\}$/, '')
              const jsonText = stripped.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
              result = JSON.parse(jsonText) as RecommendationResult
            } catch (parseErr) {
              console.error('[recommend] failed to parse Claude response:', parseErr)
              return
            }

            // Save recommendation — use service-role client to bypass RLS on insert
            const adminDb = createAdminClient()
            const recId = request.headers.get('X-Recommendation-Id') ?? crypto.randomUUID()
            const { data: savedRec, error: recError } = await adminDb
              .from('gear_recommendations')
              .insert({
                id: recId,
                user_id: user.id,
                category_id: category.id,
                top_pick_product_id: result.topPick?.productId ?? null,
                runner_up_product_id: result.runnerUp?.productId ?? null,
                recommendation_json: result,
                profile_snapshot: profile,
              })
              .select('id')
              .single()

            if (recError || !savedRec) {
              console.error('[recommend] failed to save recommendation:', recError?.message)
              return
            }

            // Save category responses
            const { error: responseError } = await adminDb
              .from('category_responses')
              .insert({
                recommendation_id: savedRec.id,
                user_id: user.id,
                category_slug: categorySlug,
                responses: layer2Responses,
                budget_min_usd: budgetMin,
                budget_max_usd: budgetMax,
              })

            if (responseError) {
              console.error('[recommend] failed to save category responses:', responseError.message)
            }

            // Increment monthly usage counter
            const { error: usageError } = await adminDb.rpc('increment_usage_counter', {
              p_user_id: user.id,
              p_period: period,
              p_rec_count: 1,
              p_comp_count: 0,
            })

            if (usageError) {
              // Fallback: read-then-write
              const current = usageResult.data?.rec_count ?? 0
              await adminDb
                .from('usage_counters')
                .upsert(
                  { user_id: user.id, period, rec_count: current + 1, comp_count: 0, updated_at: new Date().toISOString() },
                  { onConflict: 'user_id,period' }
                )
            }
          } catch (bgErr) {
            console.error('[recommend] background save error:', bgErr)
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
    console.error('[recommend]', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
