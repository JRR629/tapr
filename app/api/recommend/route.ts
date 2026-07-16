// Headroom for the streamed AI recommendation (~4096 tokens). Explicit so it
// never falls back to a short platform default post-Pro-upgrade.
export const maxDuration = 120

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductsWithReviewsForRecommendation, getNutritionProductsForRecommendation, getRunningShoeProductsForRecommendation } from '@/lib/gear'
import { anthropic, buildRecommendationPrompt, buildNutritionPrompt, filterNutritionProductsForPrompt, buildRunningShoePrompt, filterRunningShoeProductsForPrompt, debugComputeShoeFilterInfo, TAPR_SYSTEM_PROMPT, TAPR_MODEL } from '@/lib/anthropic'
import { resolveProductImageUrl } from '@/lib/storage'
import { parseModelJson } from '@/lib/parseModelJson'
import type { NutritionProductWithMentions, RunningShoeProductWithMentions } from '@/types/gear'
import type { AthleteProfile } from '@/types/profile'
import type { RecommendationResult, NutritionResult, RunningShoeResult } from '@/types/recommendation'

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

    // Debug instrumentation — ADMIN ONLY. Captures detailed prompt/profile state
    // and writes a dump to /tmp when ?debug=1. Gated on ADMIN_USER_ID so ordinary
    // users cannot trigger verbose logging or disk writes.
    const debug =
      new URL(request.url).searchParams.get('debug') === '1' &&
      user.id === process.env.ADMIN_USER_ID
    const debugBundle: Record<string, unknown> | null = debug
      ? { startedAt: new Date().toISOString(), categorySlug, layer2: layer2Responses, budgetMin, budgetMax }
      : null

    // 3. Check and deduct 1 credit (atomic — must happen before Claude call)
    const adminDb = createAdminClient()
    const { data: deducted, error: deductErr } = await adminDb.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_reason: 'recommendation',
    })
    if (deductErr || !deducted) {
      return Response.json(
        { error: "You've used all your credits. Buy a credit pack to continue.", code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      )
    }

    // Refund the deducted credit if generation fails after this point. Logs loudly
    // if the refund itself fails so it can be reconciled from credit_transactions.
    const refundCredit = async () => {
      const { error: refundErr } = await adminDb.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: 1,
        p_reason: 'refund_recommendation',
      })
      if (refundErr) console.error('[recommend] REFUND FAILED — user short 1 credit:', user.id, refundErr.message)
    }

    // 4. Fetch athlete profile
    const { data: profile, error: profileError } = await supabase
      .from('athlete_profiles')
      .select(
        'id, user_id, sports, current_focus_sport, country, race_distances, experience_level, background_sport, gender, date_of_birth, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, race_id, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      await refundCredit()
      return Response.json({ error: 'Athlete profile not found. Please complete your profile first.', code: 'PROFILE_NOT_FOUND' }, { status: 400 })
    }

    if (debugBundle) {
      debugBundle.profile = profile
    }

    // 5. Fetch active products — each category pattern uses its own fetcher:
    //   - nutrition:      product_review_mentions, nutrition-specific score columns
    //   - running-shoes:  product_review_mentions, 9 shoe-specific score columns
    //   - all others:     review_sources (wetsuit-style pattern)
    const isNutrition    = categorySlug === 'nutrition'
    const isRunningShoes = categorySlug === 'running-shoes'

    const nutritionProducts: NutritionProductWithMentions[] = isNutrition
      ? await getNutritionProductsForRecommendation(categorySlug)
      : []
    const shoeProducts: RunningShoeProductWithMentions[] = isRunningShoes
      ? await getRunningShoeProductsForRecommendation(categorySlug)
      : []
    const products = (!isNutrition && !isRunningShoes)
      ? await getProductsWithReviewsForRecommendation(categorySlug, budgetMin, budgetMax)
      : []

    // Capture shoe filter diagnostics before filtering (running-shoes only)
    if (debugBundle && isRunningShoes && shoeProducts.length > 0) {
      debugBundle.shoeFilterInfo = debugComputeShoeFilterInfo(
        shoeProducts,
        layer2Responses as Record<string, unknown>,
        profile as AthleteProfile
      )
    }

    const activeProducts = isNutrition ? nutritionProducts : isRunningShoes ? shoeProducts : products
    if (activeProducts.length === 0) {
      await refundCredit()
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
      await refundCredit()
      return Response.json({ error: 'Category not found', code: 'NOT_FOUND' }, { status: 400 })
    }

    // 7. Build prompt — each category pattern has its own builder
    const filteredNutritionProducts = isNutrition
      ? filterNutritionProductsForPrompt(nutritionProducts, layer2Responses as Record<string, unknown>)
      : []
    const filteredShoeProducts = isRunningShoes
      ? filterRunningShoeProductsForPrompt(shoeProducts, layer2Responses as Record<string, unknown>, profile as AthleteProfile, budgetMin, budgetMax)
      : []

    const prompt = isNutrition
      ? buildNutritionPrompt({
          profile: profile as AthleteProfile,
          layer2Responses: layer2Responses as Record<string, string | string[] | number | boolean>,
          products: filteredNutritionProducts,
          budgetMin,
          budgetMax,
          categorySlug,
        })
      : isRunningShoes
        ? buildRunningShoePrompt({
            profile: profile as AthleteProfile,
            layer2Responses: layer2Responses as Record<string, string | string[] | number | boolean>,
            products: filteredShoeProducts,
            budgetMin,
            budgetMax,
          })
        : buildRecommendationPrompt({
            profile: profile as AthleteProfile,
            layer2Responses: layer2Responses as Record<string, string | string[] | number | boolean>,
            products,
            budgetMin,
            budgetMax,
            categorySlug,
          })

    if (debugBundle) {
      debugBundle.promptLength = prompt.length
      debugBundle.promptPreview = prompt.slice(0, 2000)
      debugBundle.promptFull = prompt
    }

    // 8. Call Anthropic with streaming
    let streamResponse: ReturnType<typeof anthropic.messages.stream>
    try {
      streamResponse = anthropic.messages.stream({
        model: TAPR_MODEL,
        // 4096 for all categories — 2048 risked truncating richer generic
        // recommendations (wetsuits/GPS watches with Apple ecosystem notes, etc.).
        max_tokens: 4096,
        system: TAPR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })
    } catch (err) {
      console.error('[recommend] Anthropic stream init error:', err)
      await refundCredit()
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
          await refundCredit()
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`__STREAM_ERROR__:${msg}`))
          controller.close()
          return
        }

        if (debugBundle) {
          debugBundle.claudeRawResponse = accumulatedText
        }

        // Append URL map built from product review data — more reliable than
        // asking Claude to extract URLs from its own output
        const sourceUrlMap: Record<string, string> = {}
        if (isNutrition) {
          for (const product of nutritionProducts) {
            for (const mention of (product.product_review_mentions ?? [])) {
              const name = mention.review_articles?.source_name
              const url = mention.review_articles?.url
              if (name && url) sourceUrlMap[name] = url
            }
          }
        } else if (isRunningShoes) {
          for (const product of shoeProducts) {
            for (const mention of (product.product_review_mentions ?? [])) {
              const name = mention.review_articles?.source_name
              const url = mention.review_articles?.url
              if (name && url) sourceUrlMap[name] = url
            }
          }
        } else {
          for (const product of products) {
            for (const source of (product.review_sources ?? [])) {
              if (source.source_name && source.source_url) {
                sourceUrlMap[source.source_name] = source.source_url
              }
            }
          }
        }
        if (Object.keys(sourceUrlMap).length > 0) {
          controller.enqueue(encoder.encode(`\n__SOURCE_URLS__:${JSON.stringify(sourceUrlMap)}`))
        }

        // Build image map: productId → resolved image URL
        // This is injected server-side so the card never needs to know about
        // image_path, amazon_asin, or affiliate logic.
        const imageMap: Record<string, string> = {}
        if (isRunningShoes) {
          for (const product of shoeProducts) {
            const url = resolveProductImageUrl({
              imagePath: product.image_path,
              categorySlug: 'running-shoes',
              amazonImageUrl: (product as RunningShoeProductWithMentions & { amazon_image_url?: string | null }).amazon_image_url,
            })
            if (url) imageMap[product.id] = url
          }
        } else if (!isNutrition) {
          // GPS watches, wetsuits, and other non-nutrition categories
          for (const product of products) {
            const url = resolveProductImageUrl({
              imagePath: product.image_path,
              categorySlug,
            })
            if (url) imageMap[product.id] = url
          }
        }
        if (Object.keys(imageMap).length > 0) {
          controller.enqueue(encoder.encode(`\n__IMAGE_MAP__:${JSON.stringify(imageMap)}`))
        }

        // 10. Persist the recommendation BEFORE closing the stream. Fire-and-forget
        // work AFTER close() is unreliable on Vercel — the function freezes once
        // the response finishes (esp. with Fluid Compute), silently dropping the
        // save while the credit was already charged. Awaiting here guarantees it
        // runs within the request. Adds ~a few hundred ms before the stream ends.
        await (async () => {
          try {
            // Parse Claude response
            let result: RecommendationResult | NutritionResult | RunningShoeResult
            try {
              // Strip server-injected sentinels, then robustly parse (handles
              // fences, prose, and malformed JSON via jsonrepair).
              const stripped = accumulatedText
                .replace(/\n__IMAGE_MAP__:\{.*\}$/, '')
                .replace(/\n__SOURCE_URLS__:\{.*\}$/, '')
              result = parseModelJson<RecommendationResult | NutritionResult | RunningShoeResult>(
                stripped,
                () => console.warn('[recommend] Claude JSON was malformed — recovered via jsonrepair')
              )
              if (debugBundle) {
                debugBundle.parseSucceeded = true
              }
            } catch (parseErr) {
              console.error('[recommend] failed to parse Claude response (even after repair):', parseErr)
              console.error('[recommend] raw output tail (last 400 chars):', accumulatedText.slice(-400))
              await refundCredit()
              if (debugBundle) {
                debugBundle.parseSucceeded = false
                debugBundle.parseError = String(parseErr)
              }
              // Dump the raw text to /tmp so we can diagnose the malformed JSON
              // without re-running the recommendation. Server-only path, so leaking
              // to /tmp is fine in dev.
              try {
                const fs = await import('fs/promises')
                const ts = new Date().toISOString().replace(/[:.]/g, '-')
                const dumpPath = `/tmp/tapr-bad-recommendation-${ts}.txt`
                await fs.writeFile(dumpPath, accumulatedText, 'utf8')
                console.error(`[recommend] raw Claude output dumped to: ${dumpPath}`)
              } catch (dumpErr) {
                console.error('[recommend] could not dump bad response:', dumpErr)
              }
              return
            }

            // Validate all product IDs — hallucinated IDs cause silent UI failures
            // (the card shows Claude's productName text while links/compare use the wrong UUID).
            if (isRunningShoes) {
              const shoeResult = result as RunningShoeResult
              const validIds = new Set(shoeProducts.map(p => p.id))
              const resultIds = [
                shoeResult.primaryPick?.productId,
                shoeResult.alternatives?.safer?.productId,
                shoeResult.alternatives?.faster?.productId,
                shoeResult.alternatives?.value?.productId,
              ].filter(Boolean) as string[]
              const hallucinated = resultIds.filter(id => !validIds.has(id))
              if (hallucinated.length > 0) {
                console.error('[recommend] hallucinated shoe productId(s):', hallucinated, '— recommendation saved but may render incorrectly')
              }
            } else if (!isNutrition) {
              const genericResult = result as RecommendationResult
              const validIds = new Set(products.map((p: { id: string }) => p.id))
              const resultIds = [
                genericResult.topPick?.productId,
                genericResult.runnerUp?.productId,
                genericResult.upgradeOption?.productId,
              ].filter(Boolean) as string[]
              const hallucinated = resultIds.filter(id => !validIds.has(id))
              if (hallucinated.length > 0) {
                console.error('[recommend] hallucinated generic productId(s):', categorySlug, hallucinated, '— recommendation saved but may render incorrectly')
              }
            }

            // Inject server-resolved imageUrls into pick objects BEFORE saving to
            // DB. Without this, saved recommendations (loaded via ?id=) would
            // never show product images — only live-streamed ones would, because
            // the hook only injects in-memory on the live stream. Same logic as
            // the hook's injectImage, but server-side and pre-persist.
            if (Object.keys(imageMap).length > 0) {
              const inject = <T extends { productId?: string | null; imageUrl?: string | null }>(pick: T | null | undefined) => {
                if (!pick || !pick.productId) return
                const url = imageMap[pick.productId]
                if (url) pick.imageUrl = url
              }
              if (isRunningShoes) {
                const shoe = result as RunningShoeResult
                inject(shoe.primaryPick)
                inject(shoe.alternatives?.safer)
                inject(shoe.alternatives?.faster)
                inject(shoe.alternatives?.value)
                if (shoe.rotationSuggestion?.pairing) {
                  inject(shoe.rotationSuggestion.pairing.everyday)
                  inject(shoe.rotationSuggestion.pairing.raceDay)
                }
              } else if (!isNutrition) {
                const generic = result as RecommendationResult
                inject(generic.topPick)
                inject(generic.runnerUp)
                inject(generic.upgradeOption)
              }
            }

            // Save recommendation — use service-role client to bypass RLS on insert
            const recId = request.headers.get('X-Recommendation-Id') ?? crypto.randomUUID()

            let topPickId: string | null = null
            let runnerUpId: string | null = null

            if (isNutrition) {
              const nutritionResult = result as NutritionResult
              topPickId = 'bikeOptions' in nutritionResult
                ? (nutritionResult.bikeOptions[0]?.productId ?? null)
                : 'viableOptions' in nutritionResult
                  ? (nutritionResult.viableOptions[0]?.productId ?? null)
                  : null
              runnerUpId = 'runOptions' in nutritionResult
                ? (nutritionResult.runOptions[0]?.productId ?? null)
                : 'viableOptions' in nutritionResult
                  ? ((nutritionResult as { viableOptions: Array<{ productId: string | null }> }).viableOptions[1]?.productId ?? null)
                  : null
            } else if (isRunningShoes) {
              const shoeResult = result as RunningShoeResult
              // primaryPick = top_pick_product_id; alternatives.safer = runner_up_product_id (most conservative choice)
              topPickId = shoeResult.primaryPick?.productId ?? null
              runnerUpId = shoeResult.alternatives?.safer?.productId ?? null
            } else {
              const genericResult = result as RecommendationResult
              topPickId = genericResult.topPick?.productId ?? null
              runnerUpId = genericResult.runnerUp?.productId ?? null
            }

            const { data: savedRec, error: recError } = await adminDb
              .from('gear_recommendations')
              .insert({
                id: recId,
                user_id: user.id,
                category_id: category.id,
                top_pick_product_id: topPickId,
                runner_up_product_id: runnerUpId,
                recommendation_json: result,
                profile_snapshot: profile,
              })
              .select('id')
              .single()

            if (recError || !savedRec) {
              console.error('[recommend] failed to save recommendation:', recError?.message)
              await refundCredit()
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

          } catch (bgErr) {
            console.error('[recommend] background save error:', bgErr)
          }

          // Write debug bundle to disk if debug mode is enabled
          if (debugBundle) {
            try {
              const fs = await import('fs/promises')
              const ts = new Date().toISOString().replace(/[:.]/g, '-')
              const debugPath = `/tmp/tapr-debug-${ts}.json`
              await fs.writeFile(debugPath, JSON.stringify(debugBundle, null, 2), 'utf8')
              console.log(`[recommend] debug dump → ${debugPath}`)
            } catch (e) {
              console.error('[recommend] debug dump failed:', e)
            }
          }
        })()

        controller.close()
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
