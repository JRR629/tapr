import { createClient } from '@/lib/supabase/server'
import type { AthleteProfile } from '@/types/profile'
import { ProfilePageClient } from './ProfilePageClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile: AthleteProfile | null = null

  if (user) {
    const { data } = await supabase
      .from('athlete_profiles')
      .select('id, user_id, race_distances, experience_level, background_sport, gender, date_of_birth, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, race_id, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    profile = data as AthleteProfile | null
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl md:text-6xl text-white leading-none">
          MY PROFILE
        </h1>
      </div>

      <ProfilePageClient profile={profile} />

      <footer className="text-center text-[#6B7280] text-xs py-6 border-t border-[#1A3A5C] mt-12">
        TriKit AI earns a commission on purchases made through our links. This never influences our recommendations.
      </footer>
    </div>
  )
}
