import { z } from 'zod'

// Validation for PATCH /api/profile. Mirrors the user-editable columns of
// `athlete_profiles` (verified against the live DB schema). Bounds are
// deliberately GENEROUS: they exist to block oversized/abusive writes (these
// fields flow straight into the Claude prompt), not to enforce UI business
// rules — so legitimate entries are never rejected. Unknown keys are stripped
// (zod's default object behavior), which prevents writing arbitrary columns
// through the API.
//
// Callers covered:
//   - profile/ProfileEditClient.tsx — sends the full editable set ('' → null)
//   - gear/[category]/questionnaire   — sends only { foot_width, arch_type }
// (Onboarding saves via a separate server action, not this route.)

const str = (max: number) => z.string().trim().max(max).nullable().optional()
const strArr = (itemMax: number, count = 50) =>
  z.array(z.string().max(itemMax)).max(count).nullable().optional()
const num = (min: number, max: number) =>
  z.coerce.number().min(min).max(max).nullable().optional()
const intNum = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).nullable().optional()
const dateStr = z.string().max(40).nullable().optional() // 'YYYY-MM-DD'

export const athleteProfilePatchSchema = z.object({
  sports: strArr(40, 20),
  current_focus_sport: str(40),
  current_focus_distance: str(40),
  race_distances: strArr(40, 20),
  experience_level: str(64),
  background_sport: strArr(40, 20),
  gender: str(32),
  date_of_birth: dateStr,
  country: str(80),
  city: str(120),
  state: str(80),
  height_feet: intNum(0, 9),
  height_inches: intNum(0, 50),
  weight_lbs: intNum(0, 2000),
  budget_style: str(64),
  fit_issues: strArr(200),
  existing_gear: strArr(200),
  local_vs_travel: str(64),
  racing_season: str(64),
  target_race_name: str(200),
  target_race_date: dateStr,
  race_id: z.string().uuid().nullable().optional(),
  inseam_inches: num(0, 500),
  torso_length_inches: num(0, 500),
  arm_length_inches: num(0, 500),
  arm_span_inches: num(0, 500),
  shoulder_width_inches: num(0, 500),
  chest_circumference_inches: num(0, 500),
  hip_circumference_inches: num(0, 500),
  neck_circumference_inches: num(0, 500),
  flexibility_level: str(64),
  current_bike: str(200),
  foot_width: str(32),
  arch_type: str(32),
})

export type AthleteProfilePatch = z.infer<typeof athleteProfilePatchSchema>
