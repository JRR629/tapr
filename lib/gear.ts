// All Supabase gear DB queries live here — never inline in route handlers or components
import { createClient } from '@/lib/supabase/server'
import type { GearCategory, GearProduct, GearProductWithReviews } from '@/types/gear'

export async function getActiveCategories(): Promise<GearCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_categories')
    .select('id, name, slug, icon_name, description, display_order, is_active, coming_soon_email_capture')
    .order('display_order')

  if (error) {
    console.error('[gear.getActiveCategories]', error.message)
    return []
  }

  return (data ?? []) as GearCategory[]
}

export async function getProductsByCategory(categoryId: string): Promise<GearProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select('id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('overall_rating', { ascending: false })

  if (error) {
    console.error('[gear.getProductsByCategory]', error.message)
    return []
  }

  return (data ?? []) as GearProduct[]
}

// Compare picker — all products in a category including inactive ones (spec-sheet-only, niche, etc.)
// Sorted by active first, then by review_count desc so reviewed products appear at the top
export async function getAllProductsByCategory(categoryId: string): Promise<GearProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select('id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at')
    .eq('category_id', categoryId)
    .order('is_active', { ascending: false })
    .order('review_count', { ascending: false })

  if (error) {
    console.error('[gear.getAllProductsByCategory]', error.message)
    return []
  }

  return (data ?? []) as GearProduct[]
}

// Admin — all products joined with category name and slug, no active filter
export async function adminGetAllProducts(): Promise<GearProductWithReviews[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at, gear_categories(name, slug)'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[gear.adminGetAllProducts]', error.message)
    return []
  }

  // Attach empty review_sources array — reviews loaded separately per product to avoid massive payload
  return ((data ?? []) as unknown as GearProductWithReviews[]).map((p) => ({
    ...p,
    review_sources: [],
  }))
}

// Recommendation engine — products with reviews, filtered by category slug and budget range
export async function getProductsWithReviewsForRecommendation(
  categorySlug: string,
  budgetMin: number,
  budgetMax: number
): Promise<GearProductWithReviews[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at, gear_categories!inner(name, slug), review_sources(id, product_id, source_name, source_url, source_type, review_date, sentiment, key_points, full_summary, flexibility_score, buoyancy_score, comfort_score, durability_score, value_score, sponsored, created_at)'
    )
    .eq('gear_categories.slug', categorySlug)
    .eq('is_active', true)
    .gte('price_usd', budgetMin)
    .lte('price_usd', budgetMax)
    .order('overall_rating', { ascending: false })

  if (error) {
    console.error('[gear.getProductsWithReviewsForRecommendation]', error.message)
    return []
  }

  return (data ?? []) as unknown as GearProductWithReviews[]
}

// Comparison engine — fetch specific products by ID, preserving caller order
// Intentionally does NOT filter by is_active — users can compare any product in the DB,
// including inactive ones (e.g. spec-sheet-only or niche products with no reviews)
export async function getProductsByIds(
  ids: string[]
): Promise<GearProductWithReviews[]> {
  if (ids.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at, gear_categories(name, slug), review_sources(id, product_id, source_name, source_url, source_type, review_date, sentiment, key_points, full_summary, flexibility_score, buoyancy_score, comfort_score, durability_score, value_score, category_scores, sponsored, created_at)'
    )
    .in('id', ids)

  if (error) {
    console.error('[gear.getProductsByIds]', error.message)
    return []
  }

  // Supabase .in() does not guarantee order — restore caller order
  const byId = new Map(
    ((data ?? []) as unknown as GearProductWithReviews[]).map((p) => [p.id, p])
  )
  return ids.map((id) => byId.get(id)).filter(Boolean) as GearProductWithReviews[]
}

// Admin — single product with all review sources
export async function adminGetProductWithReviews(productId: string): Promise<GearProductWithReviews | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at, gear_categories(name, slug), review_sources(id, product_id, source_name, source_url, source_type, review_date, sentiment, key_points, full_summary, flexibility_score, buoyancy_score, comfort_score, durability_score, value_score, sponsored, created_at)'
    )
    .eq('id', productId)
    .single()

  if (error) {
    console.error('[gear.adminGetProductWithReviews]', error.message)
    return null
  }

  return data as unknown as GearProductWithReviews
}
