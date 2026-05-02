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

    // 3. Fetch affiliate_url server-side ONLY — never expose to client
    const { data: product, error: productError } = await supabase
      .from('gear_products')
      .select('id, affiliate_url')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return Response.json({ error: 'Product not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    if (!product.affiliate_url) {
      return Response.json({ error: 'No affiliate link available for this product', code: 'NOT_FOUND' }, { status: 404 })
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
    return Response.json({ redirectUrl: product.affiliate_url }, { status: 200 })
  } catch (error) {
    console.error('[affiliate/click]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
