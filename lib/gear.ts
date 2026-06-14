// All Supabase gear DB queries live here — never inline in route handlers or components
import { createClient } from '@/lib/supabase/server'
import type { GearCategory, GearProduct, GearProductWithReviews, NutritionProductWithMentions, RunningShoeProductWithMentions } from '@/types/gear'

export async function getActiveCategories(): Promise<GearCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_categories')
    .select('id, name, slug, icon_name, description, display_order, is_active, coming_soon_email_capture, relevant_sports')
    .order('name')

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
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at, gear_categories!inner(name, slug), review_sources(id, product_id, source_name, source_url, source_type, review_date, sentiment, key_points, full_summary, flexibility_score, buoyancy_score, comfort_score, durability_score, value_score, category_scores, sponsored, created_at)'
    )
    .eq('gear_categories.slug', categorySlug)
    .eq('is_active', true)
    .gte('price_usd', budgetMin)
    .lte('price_usd', budgetMax)
    .order('availability_status', { ascending: true })      // 'current' sorts before 'previous_gen'
    .order('review_count', { ascending: false, nullsFirst: false })
    .order('overall_rating', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[gear.getProductsWithReviewsForRecommendation]', error.message)
    return []
  }

  return (data ?? []) as unknown as GearProductWithReviews[]
}

// Nutrition recommendation engine — products with review mentions from product_review_mentions table.
// This is intentionally separate from getProductsWithReviewsForRecommendation (which joins review_sources).
// All nutrition reviews are stored in product_review_mentions, not review_sources.
// Sorted by mention count desc so most-reviewed products appear first (overall_rating is null for nutrition).
export async function getNutritionProductsForRecommendation(
  categorySlug: string
): Promise<NutritionProductWithMentions[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, created_at, gear_categories!inner(name, slug), product_review_mentions(id, product_id, article_id, final_review_weight, source_authority_key, mention_depth_key, testing_evidence_key, excerpt, summary, is_brand_owned, gi_tolerance_score, flavor_palatability_score, carbohydrate_delivery_score, sodium_electrolyte_score, caffeine_fit_score, portability_score, value_per_serving_score, gi_negative_mentions, gi_positive_mentions, created_at, review_articles(source_name, url))'
    )
    .eq('gear_categories.slug', categorySlug)
    .eq('is_active', true)

  if (error) {
    console.error('[gear.getNutritionProductsForRecommendation]', error.message)
    return []
  }

  const products = (data ?? []) as unknown as NutritionProductWithMentions[]
  return products.sort(
    (a, b) => (b.product_review_mentions?.length ?? 0) - (a.product_review_mentions?.length ?? 0)
  )
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

// Running shoe recommendation engine — products with review mentions from product_review_mentions table.
// Intentionally separate from getNutritionProductsForRecommendation (nutrition scores differ from shoe scores).
// All running shoe reviews are stored in product_review_mentions after the migration from review_sources.
// article_type_key is denormalized onto each mention row; we also select article_type from review_articles.
// Sorted by mention count desc so most-reviewed products appear first (overall_rating intentionally null for shoes).
export async function getRunningShoeProductsForRecommendation(
  categorySlug: string
): Promise<RunningShoeProductWithMentions[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, data_quality, specs_verified_at, model_year, availability_status, amazon_asin, amazon_link_confidence, amazon_asin_womens, amazon_link_confidence_womens, amazon_image_url, created_at, gear_categories!inner(name, slug), product_review_mentions(id, product_id, article_id, final_review_weight, source_authority_key, article_type_key, mention_depth_key, testing_evidence_key, excerpt, summary, is_brand_owned, ride_quality_score, cushion_protection_score, stability_score, responsiveness_score, durability_score, fit_width_accuracy_score, value_score, late_race_stability_score, road_to_trail_crossover_score, created_at, review_articles(source_name, url, article_type))'
    )
    .eq('gear_categories.slug', categorySlug)
    .eq('is_active', true)

  if (error) {
    console.error('[gear.getRunningShoeProductsForRecommendation]', error.message)
    return []
  }

  const products = (data ?? []) as unknown as RunningShoeProductWithMentions[]
  return products.sort(
    (a, b) => (b.product_review_mentions?.length ?? 0) - (a.product_review_mentions?.length ?? 0)
  )
}

export async function getRecentComparisons(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gear_comparisons')
    .select('id, created_at, winner_product_name, external_products, gear_categories(name, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[gear.getRecentComparisons]', error.message)
    return []
  }

  return data ?? []
}
