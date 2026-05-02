import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminGetAllProducts } from '@/lib/gear'

// ─── Validation schemas ───────────────────────────────────────────────────────

const reviewSourceSchema = z.object({
  source_name: z.string().min(1),
  source_url: z.string().url().nullable().optional(),
  source_type: z.enum(['written', 'video', 'community', 'retailer']),
  review_date: z.string().nullable().optional(),
  sentiment: z.enum(['positive', 'mixed', 'negative']).nullable().optional(),
  key_points: z.array(z.string()).nullable().optional(),
  full_summary: z.string().nullable().optional(),
  flexibility_score: z.number().min(1).max(5).nullable().optional(),
  buoyancy_score: z.number().min(1).max(5).nullable().optional(),
  comfort_score: z.number().min(1).max(5).nullable().optional(),
  durability_score: z.number().min(1).max(5).nullable().optional(),
  value_score: z.number().min(1).max(5).nullable().optional(),
})

const createProductSchema = z.object({
  product: z.object({
    category_id: z.string().uuid(),
    sub_category: z.string().nullable().optional(),
    name: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    price_usd: z.number().positive().nullable().optional(),
    price_range: z.enum(['budget', 'mid', 'premium', 'elite']).nullable().optional(),
    price_tier: z.enum(['entry', 'mid', 'premium']).nullable().optional(),
    buoyancy_profile: z.enum(['maximum', 'balanced', 'flexibility_focused']).nullable().optional(),
    swimmer_level: z.array(z.enum(['beginner', 'intermediate', 'advanced'])).nullable().optional(),
    race_distance_focus: z.enum(['sprint', 'olympic', 'half_distance', 'full_distance']).nullable().optional(),
    gender_category: z.enum(['mens', 'womens', 'unisex']).nullable().optional(),
    affiliate_url: z.string().nullable().optional(),
    image_path: z.string().nullable().optional(),
    specs: z.record(z.string(), z.unknown()).nullable().optional(),
    best_for: z.array(z.string()).nullable().optional(),
    not_ideal_for: z.array(z.string()).nullable().optional(),
    overall_rating: z.number().min(0).max(5).nullable().optional(),
    is_active: z.boolean().optional(),
  }),
  reviewSources: z.array(reviewSourceSchema).optional(),
})

const patchProductSchema = z.object({
  id: z.string().uuid(),
  sub_category: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  price_usd: z.number().positive().nullable().optional(),
  price_range: z.enum(['budget', 'mid', 'premium', 'elite']).nullable().optional(),
  price_tier: z.enum(['entry', 'mid', 'premium']).nullable().optional(),
  buoyancy_profile: z.enum(['maximum', 'balanced', 'flexibility_focused']).nullable().optional(),
  swimmer_level: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  race_distance_focus: z.enum(['sprint', 'olympic', 'half_distance', 'full_distance']).nullable().optional(),
  gender_category: z.enum(['mens', 'womens', 'unisex']).nullable().optional(),
  affiliate_url: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  specs: z.record(z.string(), z.unknown()).nullable().optional(),
  best_for: z.array(z.string()).nullable().optional(),
  not_ideal_for: z.array(z.string()).nullable().optional(),
  overall_rating: z.number().min(0).max(5).nullable().optional(),
  is_active: z.boolean().optional(),
})

const deleteProductSchema = z.object({
  id: z.string().uuid(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Strip affiliate_url before returning product data to client
function sanitizeProduct(product: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { affiliate_url, ...safe } = product
  return safe
}

async function checkAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, supabase, adminError: Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 }) }
  }

  if (user.id !== process.env.ADMIN_USER_ID) {
    return { user: null, supabase, adminError: Response.json({ error: 'Access denied', code: 'UNAUTHORIZED' }, { status: 403 }) }
  }

  return { user, supabase, adminError: null }
}

// ─── GET — all products ───────────────────────────────────────────────────────

export async function GET(_request: Request) {
  try {
    const { adminError } = await checkAdmin()
    if (adminError) return adminError

    const products = await adminGetAllProducts()
    const sanitized = products.map((p) => sanitizeProduct(p as unknown as Record<string, unknown>))

    return Response.json({ data: sanitized }, { status: 200 })
  } catch (error) {
    console.error('[admin/products GET]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST — create product + review sources ───────────────────────────────────

export async function POST(request: Request) {
  try {
    const { adminError, supabase } = await checkAdmin()
    if (adminError) return adminError

    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { product: productData, reviewSources = [] } = parsed.data

    // Insert product
    const { data: inserted, error: insertError } = await supabase
      .from('gear_products')
      .insert(productData)
      .select('id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, created_at')
      .single()

    if (insertError) {
      console.error('[admin/products POST] insert product:', insertError.message)
      return Response.json({ error: 'Failed to create product', code: 'DB_ERROR' }, { status: 500 })
    }

    // Insert review sources if provided
    if (reviewSources.length > 0) {
      const sourcesWithProductId = reviewSources.map((s) => ({ ...s, product_id: inserted.id }))
      const { error: sourcesError } = await supabase.from('review_sources').insert(sourcesWithProductId)

      if (sourcesError) {
        console.error('[admin/products POST] insert review sources:', sourcesError.message)
        // Product was created — return it with a warning rather than failing entirely
        return Response.json(
          { data: sanitizeProduct(inserted as Record<string, unknown>), warning: 'Product created but review sources failed to save' },
          { status: 201 }
        )
      }
    }

    return Response.json({ data: sanitizeProduct(inserted as Record<string, unknown>) }, { status: 201 })
  } catch (error) {
    console.error('[admin/products POST]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── PATCH — partial update ───────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const { adminError, supabase } = await checkAdmin()
    if (adminError) return adminError

    const body = await request.json()
    const parsed = patchProductSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { id, ...fields } = parsed.data

    const { data: updated, error: updateError } = await supabase
      .from('gear_products')
      .update(fields)
      .eq('id', id)
      .select('id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, created_at')
      .single()

    if (updateError) {
      console.error('[admin/products PATCH]', updateError.message)
      return Response.json({ error: 'Failed to update product', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data: sanitizeProduct(updated as Record<string, unknown>) }, { status: 200 })
  } catch (error) {
    console.error('[admin/products PATCH]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── DELETE — soft delete (is_active = false) ─────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const { adminError, supabase } = await checkAdmin()
    if (adminError) return adminError

    const body = await request.json()
    const parsed = deleteProductSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { id } = parsed.data

    const { error: deleteError } = await supabase
      .from('gear_products')
      .update({ is_active: false })
      .eq('id', id)

    if (deleteError) {
      console.error('[admin/products DELETE]', deleteError.message)
      return Response.json({ error: 'Failed to deactivate product', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data: { id, is_active: false } }, { status: 200 })
  } catch (error) {
    console.error('[admin/products DELETE]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
