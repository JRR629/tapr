import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('id, user_id, race_distances, experience_level, background_sport, gender, date_of_birth, country, city, state, height_feet, height_inches, weight_lbs, budget_style, fit_issues, existing_gear, local_vs_travel, racing_season, target_race_name, target_race_date, inseam_inches, torso_length_inches, arm_length_inches, arm_span_inches, shoulder_width_inches, chest_circumference_inches, hip_circumference_inches, neck_circumference_inches, flexibility_level, current_bike, foot_width, arch_type, created_at, updated_at')
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

    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid request body', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const { error } = await supabase
      .from('athlete_profiles')
      .upsert(
        { ...(body as Record<string, unknown>), user_id: user.id, updated_at: new Date().toISOString() },
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
