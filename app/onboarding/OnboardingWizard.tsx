'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { SUPPORTED_COUNTRIES, getRegionConfig } from '@/lib/locationData'
import { SPORTS, SPORT_LABELS, type Sport } from '@/lib/sports'
import { RaceDistancesField } from '@/components/RaceDistancesField'
import { saveProfile } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardAnswers {
  // Step 0
  sports: string[]
  current_focus_sport: string
  // Step 1 (conditional) or Step 2
  race_distances: string[]
  current_focus_distance: string | null
  // Step N
  experience_level: string
  // Step N+1
  background_sport: string[]
  // Step N+2
  gender: string
  // Step N+3
  date_of_birth: string
  // Step N+4
  country: string
  city: string
  state: string
  // Step N+5
  height_feet: string
  height_inches: string
  // Step N+6
  weight_lbs: string
  // Step N+7
  budget_style: string
  // Step N+8
  fit_issues: string[]
  // Step N+9
  existing_gear: string[]
  // Step N+10
  local_vs_travel: string
  racing_season: string
  // Step N+11
  has_target_race: string
  target_race_name: string
  target_race_date: string
  // Step N+12 (optional)
  inseam_inches: string
  torso_length_inches: string
  arm_length_inches: string
  arm_span_inches: string
  shoulder_width_inches: string
  chest_circumference_inches: string
  hip_circumference_inches: string
  neck_circumference_inches: string
  flexibility_level: string
  current_bike: string
  foot_width: string
  arch_type: string
}

const INITIAL: WizardAnswers = {
  sports: [],
  current_focus_sport: '',
  race_distances: [],
  current_focus_distance: null,
  experience_level: '',
  background_sport: [],
  gender: '',
  date_of_birth: '',
  country: '',
  city: '',
  state: '',
  height_feet: '',
  height_inches: '',
  weight_lbs: '',
  budget_style: '',
  fit_issues: [],
  existing_gear: [],
  local_vs_travel: '',
  racing_season: '',
  has_target_race: '',
  target_race_name: '',
  target_race_date: '',
  inseam_inches: '',
  torso_length_inches: '',
  arm_length_inches: '',
  arm_span_inches: '',
  shoulder_width_inches: '',
  chest_circumference_inches: '',
  hip_circumference_inches: '',
  neck_circumference_inches: '',
  flexibility_level: '',
  current_bike: '',
  foot_width: '',
  arch_type: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canAdvance(step: number, answers: WizardAnswers, stepKeys: string[]): boolean {
  const stepKey = stepKeys[step - 1]
  switch (stepKey) {
    case 'sports': return answers.sports.length >= 1
    case 'current_focus_sport': return answers.current_focus_sport.length > 0
    case 'race_distances': return answers.race_distances.length > 0
    case 'experience_level': return answers.experience_level !== ''
    case 'background_sport': return answers.background_sport.length > 0
    case 'gender': return answers.gender !== ''
    case 'date_of_birth': return answers.date_of_birth !== ''
    case 'country': return answers.country !== '' && answers.city.trim() !== ''
    case 'height': return answers.height_feet !== '' && answers.height_inches !== ''
    case 'weight': {
      const w = parseInt(answers.weight_lbs)
      return !isNaN(w) && w >= 80 && w <= 400
    }
    case 'budget_style': return answers.budget_style !== ''
    case 'fit_issues': return answers.fit_issues.length > 0
    case 'existing_gear': return answers.existing_gear.length > 0
    case 'racing_profile': return answers.local_vs_travel !== '' && answers.racing_season !== ''
    case 'target_race': return answers.has_target_race !== '' &&
      (answers.has_target_race === 'no' || answers.target_race_name.trim() !== '')
    case 'optional_measurements': return true
    default: return false
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionButton({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string
  sublabel?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-lg border transition-all duration-150 min-h-[56px] ${
        selected
          ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.12)] text-white scale-[1.02]'
          : 'border-[#1A3A5C] bg-[#0F2040] text-[#D1D5DB] hover:border-[#FF6B35]/50 hover:text-white'
      }`}
    >
      <span className="font-medium">{label}</span>
      {sublabel && <span className="block text-sm text-[#6B7280] mt-0.5">{sublabel}</span>}
    </button>
  )
}

function MeasurementInput({
  label,
  tooltip,
  value,
  onChange,
  unit = 'inches',
}: {
  label: string
  tooltip: string
  value: string
  onChange: (val: string) => void
  unit?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-[#D1D5DB] text-sm">{label}</label>
        <span className="text-[#6B7280] text-xs italic">— {tooltip}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          step="0.1"
          min="0"
          className="w-28 bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all"
        />
        <span className="text-[#6B7280] text-sm">{unit}</span>
      </div>
    </div>
  )
}

function NewStep0SportsSelector({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  function toggle(sport: string) {
    const current = answers.sports
    const next = current.includes(sport)
      ? current.filter(s => s !== sport)
      : [...current, sport]
    update({ sports: next })
    if (next.length === 1) {
      update({ current_focus_sport: next[0] })
    } else if (next.length === 0) {
      update({ current_focus_sport: '' })
    } else if (!next.includes(answers.current_focus_sport)) {
      update({ current_focus_sport: '' })
    }
  }
  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm mb-5">Select all that apply.</p>
      {SPORTS.map(sport => (
        <OptionButton
          key={sport}
          label={SPORT_LABELS[sport]}
          selected={answers.sports.includes(sport)}
          onClick={() => toggle(sport)}
        />
      ))}
    </div>
  )
}

function NewStep1CurrentFocusSelector({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  return (
    <div className="space-y-3">
      {answers.sports.map(sport => (
        <OptionButton
          key={sport}
          label={SPORT_LABELS[sport as Sport]}
          selected={answers.current_focus_sport === sport}
          onClick={() => update({ current_focus_sport: sport })}
        />
      ))}
    </div>
  )
}

// ─── Step renderers ───────────────────────────────────────────────────────────

function StepRaceDistances({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const sports = answers.sports as Sport[]
  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm mb-5">Select all that apply.</p>
      <RaceDistancesField
        sports={sports}
        selectedDistances={answers.race_distances}
        currentFocus={answers.current_focus_distance}
        onDistancesChange={(next) => update({ race_distances: next })}
        onCurrentFocusChange={(next) => update({ current_focus_distance: next })}
      />
    </div>
  )
}

function Step2({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'This is my first season', value: 'first_season' },
    { label: '1–3 years', value: '1_3_years' },
    { label: '3+ years', value: '3_plus_years' },
    { label: "I come from another endurance sport and I'm new to this", value: 'from_other_sport' },
  ]
  return (
    <div className="space-y-3">
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} selected={answers.experience_level === o.value} onClick={() => update({ experience_level: o.value })} />
      ))}
    </div>
  )
}

function Step3({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'Running', value: 'running' },
    { label: 'Cycling', value: 'cycling' },
    { label: 'Swimming', value: 'swimming' },
    { label: 'Gym / strength training', value: 'gym' },
    { label: 'No strong background', value: 'none' },
  ]
  function toggle(value: string) {
    const current = answers.background_sport
    if (current.includes(value)) {
      update({ background_sport: current.filter(v => v !== value) })
    } else {
      update({ background_sport: [...current, value] })
    }
  }
  return (
    <div className="space-y-3">
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} selected={answers.background_sport.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  )
}

function Step4({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non_binary' },
    { label: 'Prefer not to say', value: 'prefer_not' },
  ]
  return (
    <div className="space-y-3">
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} selected={answers.gender === o.value} onClick={() => update({ gender: o.value })} />
      ))}
    </div>
  )
}

function Step5({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm">Used to calculate your age for age-group context and masters athlete recommendations (50+).</p>
      <input
        type="date"
        value={answers.date_of_birth}
        onChange={(e) => update({ date_of_birth: e.target.value })}
        max={new Date().toISOString().split('T')[0]}
        className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] [color-scheme:dark]"
      />
    </div>
  )
}

function Step6({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const selectCls = 'w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] [color-scheme:dark]'
  const inputCls = 'w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]'
  const labelCls = 'block text-[#D1D5DB] text-sm mb-1.5'

  const regionConfig = getRegionConfig(answers.country)

  function handleCountryChange(country: string) {
    update({ country, state: '' }) // reset state when country changes
  }

  return (
    <div className="space-y-4">
      <p className="text-[#6B7280] text-sm">Used for local climate context and regional race condition awareness.</p>

      <div>
        <label className={labelCls}>Country</label>
        <select
          value={answers.country}
          onChange={(e) => handleCountryChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Select country</option>
          {SUPPORTED_COUNTRIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {answers.country && (
        <>
          <div>
            <label className={labelCls}>City</label>
            <input
              type="text"
              value={answers.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="e.g. Boulder, London, Sydney"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              {regionConfig.label}
              {!regionConfig.required && <span className="text-[#6B7280] font-normal ml-1">(optional)</span>}
            </label>
            {regionConfig.options ? (
              <select
                value={answers.state}
                onChange={(e) => update({ state: e.target.value })}
                className={selectCls}
              >
                <option value="">{regionConfig.placeholder}</option>
                {regionConfig.options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={answers.state}
                onChange={(e) => update({ state: e.target.value })}
                placeholder={regionConfig.placeholder}
                className={inputCls}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Step7({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const feet = Array.from({ length: 4 }, (_, i) => i + 4) // 4–7
  const inches = Array.from({ length: 12 }, (_, i) => i)  // 0–11
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-[#D1D5DB] text-sm mb-1.5">Feet</label>
        <select
          value={answers.height_feet}
          onChange={(e) => update({ height_feet: e.target.value })}
          className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none transition-all min-h-[44px] [color-scheme:dark]"
        >
          <option value="">ft</option>
          {feet.map(f => <option key={f} value={String(f)}>{f}&apos;</option>)}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-[#D1D5DB] text-sm mb-1.5">Inches</label>
        <select
          value={answers.height_inches}
          onChange={(e) => update({ height_inches: e.target.value })}
          className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none transition-all min-h-[44px] [color-scheme:dark]"
        >
          <option value="">in</option>
          {inches.map(i => <option key={i} value={String(i)}>{i}&quot;</option>)}
        </select>
      </div>
    </div>
  )
}

function Step8({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const val = parseInt(answers.weight_lbs) || 0
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => update({ weight_lbs: String(Math.max(80, val - 1)) })}
          className="w-12 h-12 rounded-md border border-[#1A3A5C] text-white text-xl hover:border-[#FF6B35] transition-all flex items-center justify-center"
          disabled={val <= 80}
        >
          −
        </button>
        <input
          type="number"
          value={answers.weight_lbs}
          onChange={(e) => update({ weight_lbs: e.target.value })}
          placeholder="165"
          min={80}
          max={400}
          className="flex-1 bg-[#0A1628] border border-[#1A3A5C] text-white text-center placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] font-mono text-lg"
        />
        <button
          type="button"
          onClick={() => update({ weight_lbs: String(Math.min(400, val + 1)) })}
          className="w-12 h-12 rounded-md border border-[#1A3A5C] text-white text-xl hover:border-[#FF6B35] transition-all flex items-center justify-center"
          disabled={val >= 400}
        >
          +
        </button>
        <span className="text-[#6B7280]">lbs</span>
      </div>
      <p className="text-[#6B7280] text-xs">Range: 80–400 lbs</p>
    </div>
  )
}

function Step9({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'Value-focused', sublabel: 'I want the best bang for my buck', value: 'value' },
    { label: 'Mid-range', sublabel: 'Quality matters but I\'m price conscious', value: 'mid' },
    { label: 'Performance-first', sublabel: 'I\'ll pay more for genuinely better gear', value: 'performance' },
    { label: 'No limit', sublabel: 'I want the best available regardless of cost', value: 'no_limit' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm mb-2">This pre-seeds budget ranges in each gear category. You can always adjust per category.</p>
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} sublabel={o.sublabel} selected={answers.budget_style === o.value} onClick={() => update({ budget_style: o.value })} />
      ))}
    </div>
  )
}

function Step10({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'Shoulder tightness or limited overhead flexibility', value: 'shoulder_tightness' },
    { label: 'Wide feet', value: 'wide_feet' },
    { label: 'Narrow shoulders', value: 'narrow_shoulders' },
    { label: 'Short torso', value: 'short_torso' },
    { label: 'Long torso', value: 'long_torso' },
    { label: 'None of the above', value: 'none' },
  ]
  function toggle(val: string) {
    if (val === 'none') {
      update({ fit_issues: answers.fit_issues.includes('none') ? [] : ['none'] })
      return
    }
    const without = answers.fit_issues.filter(v => v !== 'none')
    update({ fit_issues: without.includes(val) ? without.filter(v => v !== val) : [...without, val] })
  }
  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm mb-2">Select all that apply.</p>
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} selected={answers.fit_issues.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  )
}

function Step11({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const gearLabels: Record<string, string> = {
    bike: 'Bike',
    wetsuit: 'Wetsuit',
    tri_suit: 'Tri Suit',
    gps_watch: 'GPS Watch',
    cycling_kit: 'Cycling Kit',
    cycling_shoes: 'Cycling Shoes',
    running_shoes: 'Running Shoes',
    goggles: 'Goggles',
    starting_fresh: 'Starting fresh — I\'m building from scratch',
  }

  const baseOptions = ['gps_watch', 'starting_fresh']
  const sportOptions = []
  if (answers.sports.includes('triathlon')) {
    sportOptions.push('bike', 'wetsuit', 'tri_suit')
  } else {
    if (answers.sports.includes('cycling')) sportOptions.push('bike', 'cycling_kit', 'cycling_shoes')
    if (answers.sports.includes('running')) sportOptions.push('running_shoes')
    if (answers.sports.includes('swimming')) sportOptions.push('wetsuit', 'goggles')
  }
  const allOptions = Array.from(new Set([...baseOptions, ...sportOptions]))

  function toggle(val: string) {
    if (val === 'starting_fresh') {
      update({ existing_gear: answers.existing_gear.includes('starting_fresh') ? [] : ['starting_fresh'] })
      return
    }
    const without = answers.existing_gear.filter(v => v !== 'starting_fresh')
    update({ existing_gear: without.includes(val) ? without.filter(v => v !== val) : [...without, val] })
  }

  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm mb-2">Select all that apply.</p>
      {allOptions.map(o => (
        <OptionButton key={o} label={gearLabels[o]} selected={answers.existing_gear.includes(o)} onClick={() => toggle(o)} />
      ))}
    </div>
  )
}

function Step12({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const travelOptions = [
    { label: 'Mostly local — I drive to most of my races', value: 'local' },
    { label: 'Mix of local and travel', value: 'mixed' },
    { label: 'Mostly travel — I fly to races frequently', value: 'travel' },
  ]
  const seasonOptions = [
    { label: 'Spring (April–May)', value: 'spring' },
    { label: 'Summer (June–August)', value: 'summer' },
    { label: 'Fall (September–November)', value: 'fall' },
    { label: 'Year-round', value: 'year_round' },
    { label: 'Not sure yet', value: 'not_sure' },
  ]
  return (
    <div className="space-y-8">
      <div>
        <p className="text-white font-medium mb-3">Do you primarily race locally or travel to races?</p>
        <div className="space-y-2">
          {travelOptions.map(o => (
            <OptionButton key={o.value} label={o.label} selected={answers.local_vs_travel === o.value} onClick={() => update({ local_vs_travel: o.value })} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-white font-medium mb-3">What season do you primarily race in?</p>
        <div className="space-y-2">
          {seasonOptions.map(o => (
            <OptionButton key={o.value} label={o.label} selected={answers.racing_season === o.value} onClick={() => update({ racing_season: o.value })} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Step13({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <OptionButton
          label="Yes — I'm registered or targeting a specific race"
          selected={answers.has_target_race === 'yes'}
          onClick={() => update({ has_target_race: 'yes' })}
        />
        <OptionButton
          label="Not yet — I'm still deciding"
          selected={answers.has_target_race === 'no'}
          onClick={() => update({ has_target_race: 'no', target_race_name: '', target_race_date: '' })}
        />
      </div>

      {answers.has_target_race === 'yes' && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-[#D1D5DB] text-sm mb-1.5">What race are you targeting?</label>
            <input
              type="text"
              value={answers.target_race_name}
              onChange={(e) => update({ target_race_name: e.target.value })}
              placeholder="e.g. Ironman 70.3 North Carolina 2025"
              className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-[#D1D5DB] text-sm mb-1.5">Target race date <span className="text-[#6B7280]">(optional)</span></label>
            <input
              type="date"
              value={answers.target_race_date}
              onChange={(e) => update({ target_race_date: e.target.value })}
              className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] [color-scheme:dark]"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Step14({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const hasBike = answers.existing_gear.includes('bike')
  const hasLongDistance = answers.race_distances.some(d => d.startsWith('tri:') && ['70_3', 'ironman', 'ultra'].some(ld => d.includes(ld)))
  const showBikeFit = hasBike || hasLongDistance || answers.sports.includes('cycling')
  const showRunningFit = answers.sports.includes('running') || answers.sports.includes('triathlon')
  const showSwimmingFit = answers.sports.includes('swimming') || answers.sports.includes('triathlon')

  return (
    <div className="space-y-8">
      {/* Body measurements */}
      <div>
        <h3 className="font-display text-2xl text-white mb-1">BODY MEASUREMENTS</h3>
        <p className="text-[#6B7280] text-sm mb-4">Stand with a soft tape measure. All fields optional.</p>
        <div className="space-y-4">
          {(showRunningFit || showSwimmingFit) && (
            <MeasurementInput label="Inseam length" tooltip="Floor to crotch along inside of leg" value={answers.inseam_inches} onChange={(v) => update({ inseam_inches: v })} />
          )}
          {(showSwimmingFit || showBikeFit) && (
            <MeasurementInput label="Torso length" tooltip="Base of neck (bony bump) down to top of hip bone" value={answers.torso_length_inches} onChange={(v) => update({ torso_length_inches: v })} />
          )}
          {showSwimmingFit && (
            <>
              <MeasurementInput label="Arm length" tooltip="Tip of shoulder to wrist with arm slightly bent" value={answers.arm_length_inches} onChange={(v) => update({ arm_length_inches: v })} />
              <MeasurementInput label="Arm span" tooltip="Fingertip to fingertip with arms fully extended" value={answers.arm_span_inches} onChange={(v) => update({ arm_span_inches: v })} />
              <MeasurementInput label="Shoulder width" tooltip="Outer edge of one shoulder to the other across upper back" value={answers.shoulder_width_inches} onChange={(v) => update({ shoulder_width_inches: v })} />
              <MeasurementInput label="Chest circumference" tooltip="Around fullest part of chest, tape horizontal" value={answers.chest_circumference_inches} onChange={(v) => update({ chest_circumference_inches: v })} />
              <MeasurementInput label="Neck circumference" tooltip="Around base of neck where a shirt collar would sit" value={answers.neck_circumference_inches} onChange={(v) => update({ neck_circumference_inches: v })} />
            </>
          )}
          {(showSwimmingFit || showRunningFit) && (
            <MeasurementInput label="Hip circumference" tooltip="Around fullest part of hips, about 8 inches below waist" value={answers.hip_circumference_inches} onChange={(v) => update({ hip_circumference_inches: v })} />
          )}
        </div>
      </div>

      {/* Bike fit inputs — shown if athlete has bike, long distance tri, or cycles */}
      {showBikeFit && (
        <div>
          <h3 className="font-display text-2xl text-white mb-1">BIKE FIT</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[#D1D5DB] text-sm mb-3">Flexibility self-assessment</p>
              <div className="space-y-2">
                {[
                  { label: 'Very flexible — I can easily touch my toes and reach overhead without restriction', value: 'very_flexible' },
                  { label: 'Average — some tightness but manageable', value: 'average' },
                  { label: 'Limited — I struggle to touch my toes or fully extend overhead', value: 'limited' },
                  { label: 'Poor — significant flexibility restrictions affecting my riding position', value: 'poor' },
                ].map(o => (
                  <OptionButton key={o.value} label={o.label} selected={answers.flexibility_level === o.value} onClick={() => update({ flexibility_level: o.value })} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[#D1D5DB] text-sm mb-1.5">Current bike <span className="text-[#6B7280]">(optional)</span></label>
              <input
                type="text"
                value={answers.current_bike}
                onChange={(e) => update({ current_bike: e.target.value })}
                placeholder="e.g. 2022 Cervélo P3, size 54cm"
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Running fit inputs */}
      {showRunningFit && (
        <div>
          <h3 className="font-display text-2xl text-white mb-1">RUNNING FIT</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[#D1D5DB] text-sm mb-3">Foot width preference</p>
              <div className="space-y-2">
                {[
                  { label: 'Narrow', value: 'narrow' },
                  { label: 'Standard / medium', value: 'standard' },
                  { label: 'Wide', value: 'wide' },
                  { label: 'Extra wide', value: 'extra_wide' },
                  { label: 'Not sure', value: 'not_sure' },
                ].map(o => (
                  <OptionButton key={o.value} label={o.label} selected={answers.foot_width === o.value} onClick={() => update({ foot_width: o.value })} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#D1D5DB] text-sm mb-3">Arch type <span className="text-[#6B7280]">(if known)</span></p>
              <div className="space-y-2">
                {[
                  { label: 'Flat / low arch', value: 'flat' },
                  { label: 'Neutral arch', value: 'neutral' },
                  { label: 'High arch', value: 'high' },
                  { label: 'Not sure', value: 'not_sure' },
                ].map(o => (
                  <OptionButton key={o.value} label={o.label} selected={answers.arch_type === o.value} onClick={() => update({ arch_type: o.value })} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step metadata ─────────────────────────────────────────────────────────────

const QUESTION_BY_KEY: Record<string, string> = {
  sports: 'What sport(s) do you race or train for?',
  current_focus_sport: 'Which sport are you currently focused on?',
  race_distances: 'What are your race distances?',
  experience_level: 'How long have you been training in your sport?',
  background_sport: 'What sport or activity is your strongest background?',
  gender: 'What is your gender?',
  date_of_birth: 'What is your date of birth?',
  country: 'Where are you based?',
  height: 'What is your height?',
  weight: 'What is your weight?',
  budget_style: 'How would you describe your approach to gear spending?',
  fit_issues: 'Do you have any known fit issues we should factor in?',
  existing_gear: 'What gear do you already own?',
  racing_profile: 'Tell us about your racing profile.',
  target_race: 'Do you have a specific race in mind?',
  optional_measurements: 'Optional: precise measurements',
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animKey, setAnimKey] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>(INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stepKeys = useMemo(() => {
    const base = ['sports']
    if (answers.sports.length > 1) base.push('current_focus_sport')
    base.push('race_distances', 'experience_level', 'background_sport', 'gender', 'date_of_birth', 'country', 'height', 'weight', 'budget_style', 'fit_issues', 'existing_gear', 'racing_profile', 'target_race', 'optional_measurements')
    return base
  }, [answers.sports.length])

  const TOTAL_REQUIRED_STEPS = stepKeys.length - 1
  const isOptionalStep = step === stepKeys.length
  const progressPct = Math.min((step / TOTAL_REQUIRED_STEPS) * 100, 100)

  function update(partial: Partial<WizardAnswers>) {
    setAnswers(prev => ({ ...prev, ...partial }))
  }

  function goNext() {
    setDirection('forward')
    setAnimKey(k => k + 1)
    setStep(s => s + 1)
  }

  function goBack() {
    setDirection('back')
    setAnimKey(k => k + 1)
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    // Map 'none' fit_issues to empty array for DB
    const fit_issues = answers.fit_issues.filter(v => v !== 'none')
    const existing_gear = answers.existing_gear.filter(v => v !== 'starting_fresh')

    // If single sport, ensure current_focus_sport is set
    const current_focus_sport = answers.sports.length === 1 ? answers.sports[0] : answers.current_focus_sport

    const payload = {
      ...answers,
      fit_issues,
      existing_gear,
      current_focus_sport,
      height_feet: answers.height_feet,
      height_inches: answers.height_inches,
      weight_lbs: answers.weight_lbs,
      inseam_inches: answers.inseam_inches || null,
      torso_length_inches: answers.torso_length_inches || null,
      arm_length_inches: answers.arm_length_inches || null,
      arm_span_inches: answers.arm_span_inches || null,
      shoulder_width_inches: answers.shoulder_width_inches || null,
      chest_circumference_inches: answers.chest_circumference_inches || null,
      hip_circumference_inches: answers.hip_circumference_inches || null,
      neck_circumference_inches: answers.neck_circumference_inches || null,
    }

    try {
      const result = await saveProfile(payload)
      if (result?.error) {
        setSubmitError(result.error)
      } else if (result?.fieldErrors) {
        const fields = Object.entries(result.fieldErrors)
        const summary = fields
          .map(([field, errs]) => `${field}: ${(errs as string[])?.[0] ?? 'invalid'}`)
          .join('; ')
        setSubmitError(`Please complete: ${summary}`)
        console.error('[onboarding] field errors:', result.fieldErrors)
      }
    } catch (e) {
      // redirect() throws NEXT_REDIRECT which we want to bubble; anything else is a real error
      if (e instanceof Error && e.message.includes('NEXT_REDIRECT')) throw e
      setSubmitError(e instanceof Error ? e.message : 'Unknown error')
      console.error('[onboarding] submit error:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const ready = canAdvance(step, answers, stepKeys)

  const slideClass = direction === 'forward'
    ? 'animate-slide-in-forward'
    : 'animate-slide-in-back'

  const stepQuestion = step <= stepKeys.length
    ? QUESTION_BY_KEY[stepKeys[step - 1]] ?? ''
    : ''

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto w-full">
      {/* Logo */}
      <div className="mb-8">
        <Image src="/logo-sidebar.svg" alt="Tapr" width={160} height={69} priority />
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#6B7280] text-xs">
            {isOptionalStep ? 'Optional — add when ready' : `Step ${step} of ${TOTAL_REQUIRED_STEPS}`}
          </span>
          <span className="text-[#6B7280] text-xs font-mono">
            {isOptionalStep ? '✓ Required complete' : `${Math.round(progressPct)}%`}
          </span>
        </div>
        <div className="h-1.5 bg-[#1A3A5C] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6B35] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1">
        <div key={animKey} className={slideClass}>
          {/* Question heading */}
          <h1 className="font-display text-4xl md:text-5xl text-white mb-6 leading-tight">
            {isOptionalStep
              ? 'OPTIONAL: GET MORE PRECISE RECOMMENDATIONS'
              : stepQuestion.toUpperCase()}
          </h1>

          {isOptionalStep && (
            <p className="text-[#D1D5DB] mb-6 text-sm leading-relaxed">
              These measurements help us match gear to your exact body proportions — especially for wetsuits, bikes, and tri suits. Takes about 5 minutes with a soft tape measure. You can skip this now and add measurements anytime from your profile.
            </p>
          )}

          {/* Render step based on stepKey */}
          {stepKeys[step - 1] === 'sports' && <NewStep0SportsSelector answers={answers} update={update} />}
          {stepKeys[step - 1] === 'current_focus_sport' && <NewStep1CurrentFocusSelector answers={answers} update={update} />}
          {stepKeys[step - 1] === 'race_distances' && <StepRaceDistances answers={answers} update={update} />}
          {stepKeys[step - 1] === 'experience_level' && <Step2 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'background_sport' && <Step3 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'gender' && <Step4 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'date_of_birth' && <Step5 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'country' && <Step6 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'height' && <Step7 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'weight' && <Step8 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'budget_style' && <Step9 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'fit_issues' && <Step10 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'existing_gear' && <Step11 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'racing_profile' && <Step12 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'target_race' && <Step13 answers={answers} update={update} />}
          {stepKeys[step - 1] === 'optional_measurements' && <Step14 answers={answers} update={update} />}
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4 bg-[#EF444420] border border-[#EF4444] text-[#EF4444] text-sm rounded-md px-4 py-3">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-3 items-center">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            disabled={isSubmitting}
            className="border border-[#1A3A5C] hover:border-[#FF6B35] text-[#D1D5DB] px-6 py-3 rounded-md transition-all min-h-[44px] hover:scale-[1.02] active:scale-[0.98]"
          >
            Back
          </button>
        )}

        <div className="flex-1 flex gap-3 justify-end">
          {/* Skip button on optional step only */}
          {isOptionalStep && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="border border-[#1A3A5C] hover:border-[#FF6B35] text-[#6B7280] hover:text-white px-6 py-3 rounded-md transition-all min-h-[44px]"
            >
              {isSubmitting ? 'Saving...' : 'Skip for now'}
            </button>
          )}

          {/* Primary CTA */}
          {!isOptionalStep && (
            <button
              type="button"
              onClick={goNext}
              disabled={!ready}
              className="bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              Continue
            </button>
          )}

          {/* Final submit button */}
          {isOptionalStep && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              {isSubmitting ? 'Saving...' : 'Save & Go to Dashboard'}
            </button>
          )}
        </div>
      </div>

      {/* Affiliate disclosure on final step */}
      {isOptionalStep && (
        <p className="text-center text-[#6B7280] text-xs mt-6 leading-relaxed">
          Tapr is free to use. We earn affiliate commissions when you buy gear through our links. Our AI recommendations are never influenced by commission rates.
        </p>
      )}
    </div>
  )
}
