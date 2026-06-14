export interface AthleteProfile {
  id: string
  user_id: string
  race_distances: string[] | null
  sports: string[] | null
  current_focus_sport: string | null
  current_focus_distance: string | null
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
