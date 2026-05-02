export interface Database {
  public: {
    Tables: {
      athlete_profiles: {
        Row: AthleteProfileRow
        Insert: Partial<AthleteProfileRow>
        Update: Partial<AthleteProfileRow>
      }
      gear_categories: {
        Row: GearCategoryRow
        Insert: Partial<GearCategoryRow>
        Update: Partial<GearCategoryRow>
      }
      gear_products: {
        Row: GearProductRow
        Insert: Partial<GearProductRow>
        Update: Partial<GearProductRow>
      }
    }
  }
}

interface AthleteProfileRow {
  id: string
  user_id: string
  race_distances: string[] | null
  experience_level: string | null
  background_sport: string[] | null
  country: string | null
  gender: string | null
  date_of_birth: string | null
  city: string | null
  state: string | null
  height_feet: number | null
  height_inches: number | null
  weight_lbs: number | null
  budget_style: string | null
  fit_issues: string[] | null
  existing_gear: string[] | null
  local_vs_travel: string | null
  racing_season: string | null
  target_race_name: string | null
  target_race_date: string | null
  race_id: string | null
  inseam_inches: number | null
  torso_length_inches: number | null
  arm_length_inches: number | null
  arm_span_inches: number | null
  shoulder_width_inches: number | null
  chest_circumference_inches: number | null
  hip_circumference_inches: number | null
  neck_circumference_inches: number | null
  flexibility_level: string | null
  current_bike: string | null
  foot_width: string | null
  arch_type: string | null
  created_at: string
  updated_at: string
}

interface GearCategoryRow {
  id: string
  name: string
  slug: string
  icon_name: string | null
  description: string | null
  display_order: number | null
  is_active: boolean
  coming_soon_email_capture: boolean
}

interface GearProductRow {
  id: string
  category_id: string
  sub_category: string | null
  name: string
  brand: string
  model: string
  price_usd: number | null
  price_range: string | null
  affiliate_url: string | null
  image_path: string | null
  specs: Record<string, unknown> | null
  best_for: string[] | null
  not_ideal_for: string[] | null
  overall_rating: number | null
  review_count: number
  is_active: boolean
  created_at: string
}
