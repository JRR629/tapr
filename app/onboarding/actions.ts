'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  race_distances: z.array(z.string()).min(1, 'Select at least one distance'),
  sports: z.array(z.string()).min(1, 'Select at least one sport'),
  current_focus_sport: z.string().min(1),
  current_focus_distance: z.string().optional().nullable(),
  experience_level: z.string().min(1),
  background_sport: z.array(z.string()).min(1, 'Select at least one sport'),
  gender: z.string().min(1),
  date_of_birth: z.string().min(1),
  country: z.string().min(1, 'Select a country'),
  city: z.string().optional(),
  state: z.string().optional(),
  height_feet: z.coerce.number().int().min(4).max(7),
  height_inches: z.coerce.number().int().min(0).max(11),
  weight_lbs: z.coerce.number().int().min(80).max(400),
  budget_style: z.string().min(1),
  fit_issues: z.array(z.string()),
  existing_gear: z.array(z.string()),
  local_vs_travel: z.string().min(1),
  racing_season: z.string().min(1),
  target_race_name: z.string().optional(),
  target_race_date: z.string().optional(),
  // Optional measurements — all nullable
  inseam_inches: z.coerce.number().positive().optional().nullable(),
  torso_length_inches: z.coerce.number().positive().optional().nullable(),
  arm_length_inches: z.coerce.number().positive().optional().nullable(),
  arm_span_inches: z.coerce.number().positive().optional().nullable(),
  shoulder_width_inches: z.coerce.number().positive().optional().nullable(),
  chest_circumference_inches: z.coerce.number().positive().optional().nullable(),
  hip_circumference_inches: z.coerce.number().positive().optional().nullable(),
  neck_circumference_inches: z.coerce.number().positive().optional().nullable(),
  flexibility_level: z.string().optional(),
  current_bike: z.string().optional(),
  foot_width: z.string().optional(),
  arch_type: z.string().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export interface SaveProfileResult {
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function saveProfile(raw: unknown): Promise<SaveProfileResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const data = parsed.data

  // Coerce empty optional strings to null
  function nullIfEmpty(val: string | undefined): string | null {
    return val && val.trim().length > 0 ? val.trim() : null
  }

  const { error: profileError } = await supabase.from('athlete_profiles').insert({
    user_id: user.id,
    race_distances: data.race_distances,
    sports: data.sports,
    current_focus_sport: data.current_focus_sport,
    current_focus_distance: data.current_focus_distance ?? null,
    experience_level: data.experience_level,
    background_sport: data.background_sport,
    gender: data.gender,
    date_of_birth: data.date_of_birth,
    country: data.country,
    city: nullIfEmpty(data.city),
    state: nullIfEmpty(data.state),
    height_feet: data.height_feet,
    height_inches: data.height_inches,
    weight_lbs: data.weight_lbs,
    budget_style: data.budget_style,
    fit_issues: data.fit_issues,
    existing_gear: data.existing_gear,
    local_vs_travel: data.local_vs_travel,
    racing_season: data.racing_season,
    target_race_name: nullIfEmpty(data.target_race_name),
    target_race_date: nullIfEmpty(data.target_race_date),
    inseam_inches: data.inseam_inches ?? null,
    torso_length_inches: data.torso_length_inches ?? null,
    arm_length_inches: data.arm_length_inches ?? null,
    arm_span_inches: data.arm_span_inches ?? null,
    shoulder_width_inches: data.shoulder_width_inches ?? null,
    chest_circumference_inches: data.chest_circumference_inches ?? null,
    hip_circumference_inches: data.hip_circumference_inches ?? null,
    neck_circumference_inches: data.neck_circumference_inches ?? null,
    flexibility_level: nullIfEmpty(data.flexibility_level),
    current_bike: nullIfEmpty(data.current_bike),
    foot_width: nullIfEmpty(data.foot_width),
    arch_type: nullIfEmpty(data.arch_type),
  })

  if (profileError) {
    console.error('[saveProfile] insert error:', profileError.message)
    return { error: 'Failed to save profile. Please try again.' }
  }


  redirect('/dashboard')
}
