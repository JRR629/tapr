'use client'

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import type { AthleteProfile } from '@/types/profile'
import { TRIATHLON_COUNTRIES, getRegionConfig } from '@/lib/locationData'

interface ProfileEditClientProps {
  profile: AthleteProfile | null
}

type FormData = Partial<
  Pick<
    AthleteProfile,
    | 'race_distances'
    | 'experience_level'
    | 'background_sport'
    | 'gender'
    | 'date_of_birth'
    | 'country'
    | 'city'
    | 'state'
    | 'height_feet'
    | 'height_inches'
    | 'weight_lbs'
    | 'budget_style'
    | 'fit_issues'
    | 'existing_gear'
    | 'local_vs_travel'
    | 'racing_season'
    | 'target_race_name'
    | 'target_race_date'
    // Measurements
    | 'inseam_inches'
    | 'torso_length_inches'
    | 'arm_length_inches'
    | 'arm_span_inches'
    | 'shoulder_width_inches'
    | 'chest_circumference_inches'
    | 'hip_circumference_inches'
    | 'neck_circumference_inches'
    | 'flexibility_level'
    | 'current_bike'
    | 'foot_width'
    | 'arch_type'
  >
>

const inputClass =
  'bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] min-h-[44px] w-full transition-shadow'

const selectClass = `${inputClass} cursor-pointer`

const labelClass = 'block text-[#D1D5DB] text-sm font-semibold mb-1'

// Checkbox multi-select helper
function MultiCheckbox({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium border transition-all min-h-[44px]
                hover:scale-[1.02] active:scale-[0.98]
                ${active
                  ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.12)] text-[#FF6B35]'
                  : 'border-[#1A3A5C] text-[#6B7280] hover:border-[#FF6B35] hover:text-white'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ProfileEditClient({ profile }: ProfileEditClientProps) {
  const [form, setForm] = useState<FormData>({
    race_distances: profile?.race_distances ?? [],
    experience_level: profile?.experience_level ?? '',
    background_sport: profile?.background_sport ?? [],
    country: profile?.country ?? '',
    gender: profile?.gender ?? '',
    date_of_birth: profile?.date_of_birth ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    height_feet: profile?.height_feet ?? undefined,
    height_inches: profile?.height_inches ?? undefined,
    weight_lbs: profile?.weight_lbs ?? undefined,
    budget_style: profile?.budget_style ?? '',
    fit_issues: profile?.fit_issues ?? [],
    existing_gear: profile?.existing_gear ?? [],
    local_vs_travel: profile?.local_vs_travel ?? '',
    racing_season: profile?.racing_season ?? '',
    target_race_name: profile?.target_race_name ?? '',
    target_race_date: profile?.target_race_date ?? '',
    // Measurements
    inseam_inches: profile?.inseam_inches ?? undefined,
    torso_length_inches: profile?.torso_length_inches ?? undefined,
    arm_length_inches: profile?.arm_length_inches ?? undefined,
    arm_span_inches: profile?.arm_span_inches ?? undefined,
    shoulder_width_inches: profile?.shoulder_width_inches ?? undefined,
    chest_circumference_inches: profile?.chest_circumference_inches ?? undefined,
    hip_circumference_inches: profile?.hip_circumference_inches ?? undefined,
    neck_circumference_inches: profile?.neck_circumference_inches ?? undefined,
    flexibility_level: profile?.flexibility_level ?? '',
    current_bike: profile?.current_bike ?? '',
    foot_width: profile?.foot_width ?? '',
    arch_type: profile?.arch_type ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle')
  const [measurementsOpen, setMeasurementsOpen] = useState(false)

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveState('idle')

    // Clean up empty strings to null for optional fields
    const payload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || v === undefined) {
        payload[k] = null
      } else {
        payload[k] = v
      }
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSaveState('success')
        setTimeout(() => setSaveState('idle'), 3000)
      } else {
        setSaveState('error')
      }
    } catch {
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Save bar */}
      {saveState === 'success' && (
        <div className="flex items-center gap-2 bg-[rgba(34,197,94,0.1)] border border-[#22C55E] text-[#22C55E] rounded-md px-4 py-3">
          <CheckCircle size={16} />
          <span className="text-sm font-semibold">Profile saved successfully</span>
        </div>
      )}
      {saveState === 'error' && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-[#EF4444] rounded-md px-4 py-3">
          <span className="text-sm font-semibold">Failed to save. Please try again.</span>
        </div>
      )}

      {/* Section: Racing background */}
      <section>
        <h2 className="font-display text-3xl text-white mb-6">RACING BACKGROUND</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiCheckbox
            label="Race Distances"
            options={[
              { value: 'sprint', label: 'Sprint' },
              { value: 'olympic', label: 'Olympic' },
              { value: '70.3', label: '70.3' },
              { value: 'ironman', label: 'Ironman' },
            ]}
            selected={form.race_distances ?? []}
            onChange={(v) => setField('race_distances', v)}
          />

          <div>
            <label className={labelClass}>Experience Level</label>
            <select
              value={form.experience_level ?? ''}
              onChange={(e) => setField('experience_level', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="first_season">First Season</option>
              <option value="1_3_years">1–3 Years</option>
              <option value="3_plus_years">3+ Years</option>
              <option value="from_other_sport">From Other Sport</option>
            </select>
          </div>

          <MultiCheckbox
            label="Background Sport"
            options={[
              { value: 'running', label: 'Running' },
              { value: 'cycling', label: 'Cycling' },
              { value: 'swimming', label: 'Swimming' },
              { value: 'gym', label: 'Gym / Fitness' },
              { value: 'none', label: 'None' },
            ]}
            selected={form.background_sport ?? []}
            onChange={(v) => setField('background_sport', v)}
          />

          <div>
            <label className={labelClass}>Racing Pattern</label>
            <select
              value={form.local_vs_travel ?? ''}
              onChange={(e) => setField('local_vs_travel', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="local">Mostly Local</option>
              <option value="mixed">Mixed Local & Travel</option>
              <option value="travel">Destination Racing</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Primary Racing Season</label>
            <select
              value={form.racing_season ?? ''}
              onChange={(e) => setField('racing_season', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="year_round">Year Round</option>
              <option value="not_sure">Not Sure Yet</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Target Race Name</label>
            <input
              type="text"
              value={form.target_race_name ?? ''}
              onChange={(e) => setField('target_race_name', e.target.value)}
              placeholder="e.g. Ironman Lake Placid"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Target Race Date</label>
            <input
              type="date"
              value={form.target_race_date ?? ''}
              onChange={(e) => setField('target_race_date', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Section: Personal stats */}
      <section>
        <h2 className="font-display text-3xl text-white mb-6">PERSONAL STATS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Gender</label>
            <select
              value={form.gender ?? ''}
              onChange={(e) => setField('gender', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-Binary</option>
              <option value="prefer_not">Prefer Not to Say</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth ?? ''}
              onChange={(e) => setField('date_of_birth', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <select
              value={form.country ?? ''}
              onChange={(e) => { setField('country', e.target.value); setField('state', '') }}
              className={selectClass}
            >
              <option value="">Select country</option>
              {TRIATHLON_COUNTRIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={form.city ?? ''}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="e.g. Boulder, London, Sydney"
              className={inputClass}
            />
          </div>

          {(() => {
            const regionConfig = getRegionConfig(form.country ?? '')
            return (
              <div>
                <label className={labelClass}>
                  {regionConfig.label}
                  {!regionConfig.required && <span className="text-[#6B7280] font-normal ml-1">(optional)</span>}
                </label>
                {regionConfig.options ? (
                  <select
                    value={form.state ?? ''}
                    onChange={(e) => setField('state', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{regionConfig.placeholder}</option>
                    {regionConfig.options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.state ?? ''}
                    onChange={(e) => setField('state', e.target.value)}
                    placeholder={regionConfig.placeholder}
                    className={inputClass}
                  />
                )}
              </div>
            )
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Height (ft)</label>
              <input
                type="number"
                value={form.height_feet ?? ''}
                onChange={(e) => setField('height_feet', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="5"
                min={3}
                max={8}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Height (in)</label>
              <input
                type="number"
                value={form.height_inches ?? ''}
                onChange={(e) => setField('height_inches', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="10"
                min={0}
                max={11}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Weight (lbs)</label>
            <input
              type="number"
              value={form.weight_lbs ?? ''}
              onChange={(e) => setField('weight_lbs', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="165"
              min={60}
              max={400}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Section: Preferences */}
      <section>
        <h2 className="font-display text-3xl text-white mb-6">PREFERENCES &amp; FIT</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Budget Style</label>
            <select
              value={form.budget_style ?? ''}
              onChange={(e) => setField('budget_style', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="value">Value — Best bang for buck</option>
              <option value="mid">Mid-Range — Good quality, reasonable price</option>
              <option value="performance">Performance — Best gear, budget flexible</option>
              <option value="no_limit">No Limit — Only the best</option>
            </select>
          </div>

          <MultiCheckbox
            label="Existing Gear"
            options={[
              { value: 'bike', label: 'Bike' },
              { value: 'wetsuit', label: 'Wetsuit' },
              { value: 'tri_suit', label: 'Tri Suit' },
              { value: 'gps_watch', label: 'GPS Watch' },
            ]}
            selected={form.existing_gear ?? []}
            onChange={(v) => setField('existing_gear', v)}
          />

          <MultiCheckbox
            label="Known Fit Issues"
            options={[
              { value: 'shoulder_tightness', label: 'Shoulder Tightness' },
              { value: 'wide_feet', label: 'Wide Feet' },
              { value: 'narrow_shoulders', label: 'Narrow Shoulders' },
              { value: 'short_torso', label: 'Short Torso' },
              { value: 'long_torso', label: 'Long Torso' },
            ]}
            selected={form.fit_issues ?? []}
            onChange={(v) => setField('fit_issues', v)}
          />

          <div>
            <label className={labelClass}>Current Bike</label>
            <input
              type="text"
              value={form.current_bike ?? ''}
              onChange={(e) => setField('current_bike', e.target.value)}
              placeholder="e.g. Trek Speed Concept"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Foot Width</label>
            <select
              value={form.foot_width ?? ''}
              onChange={(e) => setField('foot_width', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="narrow">Narrow</option>
              <option value="standard">Standard</option>
              <option value="wide">Wide</option>
              <option value="extra_wide">Extra Wide</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Arch Type</label>
            <select
              value={form.arch_type ?? ''}
              onChange={(e) => setField('arch_type', e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="flat">Flat</option>
              <option value="neutral">Neutral</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </section>

      {/* Optional measurements — collapsible */}
      <section>
        <button
          type="button"
          onClick={() => setMeasurementsOpen((o) => !o)}
          className="flex items-center gap-3 w-full text-left group min-h-[44px]"
        >
          <h2 className="font-display text-3xl text-white group-hover:text-[#FF6B35] transition-colors">
            PRECISION MEASUREMENTS
          </h2>
          <span className="text-[#6B7280] group-hover:text-[#FF6B35] transition-colors">
            {measurementsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
          <span className="text-[#6B7280] text-sm ml-1">(optional)</span>
        </button>

        {measurementsOpen && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <p className="text-[#6B7280] text-sm col-span-full">
              These measurements improve wetsuit and tri suit fit recommendations significantly. All values in inches.
            </p>

            {(
              [
                ['inseam_inches', 'Inseam'],
                ['torso_length_inches', 'Torso Length'],
                ['arm_length_inches', 'Arm Length'],
                ['arm_span_inches', 'Arm Span'],
                ['shoulder_width_inches', 'Shoulder Width'],
                ['chest_circumference_inches', 'Chest Circumference'],
                ['hip_circumference_inches', 'Hip Circumference'],
                ['neck_circumference_inches', 'Neck Circumference'],
              ] as [keyof FormData, string][]
            ).map(([key, fieldLabel]) => (
              <div key={key}>
                <label className={labelClass}>{fieldLabel} (inches)</label>
                <input
                  type="number"
                  step="0.25"
                  value={(form[key] as number | undefined) ?? ''}
                  onChange={(e) =>
                    setField(key, e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="0.0"
                  className={inputClass}
                />
              </div>
            ))}

            <div>
              <label className={labelClass}>Flexibility Level</label>
              <select
                value={form.flexibility_level ?? ''}
                onChange={(e) => setField('flexibility_level', e.target.value)}
                className={selectClass}
              >
                <option value="">Select...</option>
                <option value="very_flexible">Very Flexible</option>
                <option value="average">Average</option>
                <option value="limited">Limited</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saveState === 'success' && (
          <div className="flex items-center gap-2 text-[#22C55E]">
            <CheckCircle size={16} />
            <span className="text-sm font-semibold">Saved!</span>
          </div>
        )}
      </div>
    </form>
  )
}
