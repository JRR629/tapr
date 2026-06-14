export interface GearCategory {
  id: string
  name: string
  slug: string
  icon_name: string | null
  description: string | null
  display_order: number | null
  is_active: boolean
  coming_soon_email_capture: boolean
  relevant_sports: string[]
}

export interface GearProduct {
  id: string
  category_id: string
  sub_category: string | null
  name: string
  brand: string
  model: string
  price_usd: number | null
  price_range: string | null
  price_tier: 'entry' | 'mid' | 'premium' | null
  buoyancy_profile: 'maximum' | 'balanced' | 'flexibility_focused' | null
  swimmer_level: ('beginner' | 'intermediate' | 'advanced')[] | null
  race_distance_focus: 'sprint' | 'olympic' | 'half_distance' | 'full_distance' | null
  gender_category: 'mens' | 'womens' | 'unisex' | null
  image_path: string | null
  specs: Record<string, unknown> | null
  best_for: string[] | null
  not_ideal_for: string[] | null
  overall_rating: number | null
  review_count: number
  is_active: boolean
  data_quality: 'reviewed' | 'community_reviewed' | 'specs_verified' | 'retailer_reviewed' | 'stub'
  specs_verified_at: string | null
  model_year: number | null
  availability_status: 'current' | 'previous_gen' | 'limited' | null
  created_at: string
  // Running shoes columns (null for non-shoe products)
  amazon_asin?: string | null
  amazon_link_confidence?: 'exact_current' | 'exact_prior' | 'ambiguous' | 'avoid' | 'unknown' | null
  specs_last_verified_at?: string | null
  // Server-only — never sent to client
  affiliate_url?: string | null
  brand_url?: string | null
}

export interface ReviewSource {
  id: string
  product_id: string
  source_name: string
  source_url: string | null
  source_type: string
  review_date: string | null
  sentiment: string | null
  key_points: string[] | null
  full_summary: string | null
  flexibility_score: number | null
  buoyancy_score: number | null
  comfort_score: number | null
  durability_score: number | null
  value_score: number | null
  category_scores: Record<string, number> | null // GPS watches: gps_accuracy, battery_life, hr_accuracy, etc.
  sponsored: boolean
  created_at: string
}

export interface GearProductWithReviews extends GearProduct {
  gear_categories: { name: string; slug: string }
  review_sources: ReviewSource[]
}

export interface ProductReviewMention {
  id: string
  product_id: string
  article_id: string
  // source_name and url live on review_articles, joined via article_id
  review_articles: { source_name: string | null; url: string | null } | null
  final_review_weight: number
  source_authority_key: string
  mention_depth_key: string
  testing_evidence_key: string
  excerpt: string | null
  summary: string | null
  is_brand_owned: boolean
  gi_tolerance_score: number | null
  flavor_palatability_score: number | null
  carbohydrate_delivery_score: number | null
  sodium_electrolyte_score: number | null
  caffeine_fit_score: number | null
  portability_score: number | null
  value_per_serving_score: number | null
  gi_negative_mentions: number
  gi_positive_mentions: number
  // Running shoe scores (null for non-shoe categories)
  ride_quality_score: number | null
  cushion_protection_score: number | null
  stability_score: number | null
  responsiveness_score: number | null
  durability_score: number | null
  fit_width_accuracy_score: number | null
  value_score: number | null
  late_race_stability_score: number | null
  road_to_trail_crossover_score: number | null
  // article_type_key is on the mention row (denormalized from review_articles at write time)
  article_type_key: string | null
  created_at: string
}

export interface NutritionProductWithMentions extends GearProduct {
  gear_categories: { name: string; slug: string }
  product_review_mentions: ProductReviewMention[]
}

// ─── Running shoe types ───────────────────────────────────────────────────────

export interface RunningShoeSpecs {
  // Manufacturer specs
  weight_oz_m9: number
  weight_oz_w8: number
  heel_stack_mm: number
  forefoot_stack_mm: number
  drop_mm: number
  midsole_foam: string
  // DB values from enricher: 'carbon_plate' | 'nylon_plate' | 'full_length_plate' | 'rods' | 'shank'
  // Legacy rows may have 'carbon' or 'nylon' — always use isCarbon() helper when checking
  plate_type: 'none' | 'carbon_plate' | 'nylon_plate' | 'full_length_plate' | 'rods' | 'shank' | 'carbon' | 'nylon' | null
  rocker_geometry: 'none' | 'mild' | 'moderate' | 'aggressive' | null
  upper_material: string
  // width_options is intentionally not populated. Width is stored as booleans from the enricher:
  wide_available: boolean
  extra_wide_available: boolean
  outsole_rubber: string
  lug_depth_mm: number | null

  // RunRepeat measured (overrides brand claims on conflict)
  measured_specs?: {
    weight_oz_m9: number
    heel_stack_mm: number
    forefoot_stack_mm: number
    drop_mm: number
  }
  brand_claimed_specs?: {
    weight_oz_m9: number
    heel_stack_mm: number
    forefoot_stack_mm: number
    drop_mm: number
  }
  spec_dispute?: boolean

  // Categorical tags (set on activation)
  shoe_type: 'daily_trainer' | 'max_cushion' | 'stability' | 'tempo' | 'super_trainer' |
             'race_day_super' | 'recovery' | 'value' | 'beginner_safe' | 'trail_crossover'
  intended_surface: Array<'road'> | Array<'road' | 'light_trail'>
  predecessor_product_id: string | null

  // Race-day legality (derived from stack + plate at enrichment time)
  road_race_legal: boolean
}

export interface RunningShoeReviewMention extends ProductReviewMention {
  // For shoes, review_articles also carries article_type (the column name in DB)
  review_articles: {
    source_name: string | null
    url: string | null
    article_type: string | null
  } | null
}

export interface RunningShoeProductWithMentions extends Omit<GearProduct, 'specs'> {
  gear_categories: { name: string; slug: string }
  product_review_mentions: RunningShoeReviewMention[]
  specs: RunningShoeSpecs | null
  // Running-shoe specific Amazon columns (present on gear_products)
  amazon_asin?: string | null
  amazon_link_confidence?: 'exact_current' | 'exact_prior' | 'ambiguous' | 'avoid' | 'unknown' | null
  amazon_asin_womens?: string | null
  amazon_link_confidence_womens?: 'exact_current' | 'exact_prior' | 'ambiguous' | 'avoid' | 'unknown' | null
  // Pre-scraped Amazon CDN URL (m.media-amazon.com/images/I/...). Populated by
  // review-harvester/scrape-amazon-images.ts for shoes with verified ASINs.
  // Null for unscraped products — card falls back to category icon.
  amazon_image_url?: string | null
}
