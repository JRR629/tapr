import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  productId: z.string().uuid(),
  recommendationId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  sourcePage: z.string().optional(),
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

    const { productId, recommendationId, categorySlug, sourcePage } = parsed.data

    // 2. Auth check — anonymous clicks are allowed
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Fetch product fields server-side ONLY — never expose any URL to client
    const { data: product, error: productError } = await supabase
      .from('gear_products')
      .select('id, name, brand, affiliate_url, brand_url, amazon_asin, amazon_asin_womens, amazon_link_confidence, amazon_link_confidence_womens')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return Response.json({ error: 'Product not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // For shoes (and any other gender-aware product), pick the womens ASIN
    // when the requesting athlete is a woman. Falls back to default ASIN
    // (typically the mens listing) when no womens listing exists or no
    // profile gender is set.
    let useWomensListing = false
    if (user) {
      const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('gender')
        .eq('user_id', user.id)
        .single()
      const g = (profile?.gender ?? '').toLowerCase()
      useWomensListing = g === 'female' || g === 'woman' || g === 'women'
    }

    // URL resolution priority — Amazon-first for affiliate revenue, real
    // brand product pages as the only fallback (no search pages, no
    // homepages).
    //
    //   1. explicit affiliate_url override
    //   2. Verified Amazon (`exact_current` / `exact_prior`) →
    //      `/dp/{asin}?tag=taprai-20` — direct product page + affiliate
    //   3. brand_url — populated by review-harvester/scrape-brand-product-urls.ts
    //      for every shoe without a verified ASIN. Real product page on the
    //      brand site. No affiliate revenue (Amazon Associates only) but no
    //      search-results UI hop.
    //   4. nothing — return 404 (shouldn't fire once brand_url backfill is
    //      complete for the catalog)
    //
    // Why not Amazon search or Google search as a fallback: per user
    // direction 2026-06-07, search-results pages are second-rate UX even
    // when they earn affiliate. The scraper populates brand_url with real
    // product pages so every shoe has a direct destination.
    const AMAZON_TAG = 'taprai-20'

    const asin = useWomensListing
      ? (product.amazon_asin_womens ?? product.amazon_asin)
      : product.amazon_asin
    const confidence = useWomensListing
      ? (product.amazon_link_confidence_womens ?? product.amazon_link_confidence)
      : product.amazon_link_confidence

    const verifiedAmazon = asin && (confidence === 'exact_current' || confidence === 'exact_prior')

    let redirectUrl: string | null = null
    if (product.affiliate_url) {
      redirectUrl = product.affiliate_url
    } else if (verifiedAmazon) {
      redirectUrl = `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`
    } else if (product.brand_url) {
      redirectUrl = product.brand_url
    }

    if (!redirectUrl) {
      return Response.json({ error: 'No purchase link available for this product', code: 'NOT_FOUND' }, { status: 404 })
    }

    // 4. Log the click
    const sessionId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('affiliate_clicks')
      .insert({
        user_id: user?.id ?? null,
        product_id: productId,
        recommendation_id: recommendationId ?? null,
        category_slug: categorySlug ?? null,
        source_page: sourcePage ?? null,
        session_id: sessionId,
      })

    if (insertError) {
      // Log but don't fail — click tracking should never block the redirect
      console.error('[affiliate/click] insert error:', insertError.message)
    }

    // 5. Return redirect URL — never expose in DOM, frontend opens in new tab
    return Response.json({ redirectUrl }, { status: 200 })
  } catch (error) {
    console.error('[affiliate/click]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
