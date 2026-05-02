export interface GearCategory {
  id: string
  name: string
  slug: string
  icon_name: string | null
  description: string | null
  display_order: number | null
  is_active: boolean
  coming_soon_email_capture: boolean
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
  // Server-only — never sent to client
  affiliate_url?: string | null
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
