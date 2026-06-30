import { createClient } from '@/lib/supabase/server'
import { athleteProfilePatchSchema } from '@/lib/validation/athleteProfile'

export async function GET(_request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('id, user_id, sports, current_focus_sport, current_focus_distance, race_distances, experience_level, background_sport, gender, date_of_birth, country, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[profile GET]', error.message)
      return Response.json({ error: 'Failed to fetch profile', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data: data ?? null }, { status: 200 })
  } catch (error) {
    console.error('[profile GET]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const parsed = athleteProfilePatchSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { error } = await supabase
      .from('athlete_profiles')
      .upsert(
        { ...parsed.data, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[profile PATCH]', error.message)
      return Response.json({ error: 'Failed to update profile', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error('[profile PATCH]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
