'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TRIATHLON_COUNTRIES, getRegionConfig } from '@/lib/locationData'
import { saveProfile } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardAnswers {
  // Step 1
  race_distances: string[]
  // Step 2
  experience_level: string
  // Step 3
  background_sport: string[]
  // Step 4
  gender: string
  // Step 5
  date_of_birth: string
  // Step 6
  country: string
  city: string
  state: string
  // Step 7
  height_feet: string
  height_inches: string
  // Step 8
  weight_lbs: string
  // Step 9
  budget_style: string
  // Step 10
  fit_issues: string[]
  // Step 11
  existing_gear: string[]
  // Step 12
  local_vs_travel: string
  racing_season: string
  // Step 13
  has_target_race: string
  target_race_name: string
  target_race_date: string
  // Step 14 (optional)
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
  race_distances: [],
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

const TOTAL_REQUIRED_STEPS = 13

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canAdvance(step: number, answers: WizardAnswers): boolean {
  switch (step) {
    case 1: return answers.race_distances.length > 0
    case 2: return answers.experience_level !== ''
    case 3: return answers.background_sport.length > 0
    case 4: return answers.gender !== ''
    case 5: return answers.date_of_birth !== ''
    case 6: return answers.country !== '' && answers.city.trim() !== ''
    case 7: return answers.height_feet !== '' && answers.height_inches !== ''
    case 8: {
      const w = parseInt(answers.weight_lbs)
      return !isNaN(w) && w >= 80 && w <= 400
    }
    case 9: return answers.budget_style !== ''
    case 10: return answers.fit_issues.length > 0
    case 11: return answers.existing_gear.length > 0
    case 12: return answers.local_vs_travel !== '' && answers.racing_season !== ''
    case 13: return answers.has_target_race !== '' &&
      (answers.has_target_race === 'no' || answers.target_race_name.trim() !== '')
    case 14: return true // always skippable
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

// ─── Step renderers ───────────────────────────────────────────────────────────

function Step1({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'Sprint', value: 'sprint' },
    { label: 'Olympic', value: 'olympic' },
    { label: '70.3 Half Ironman', value: '70.3' },
    { label: 'Full Ironman', value: 'ironman' },
    { label: "I'm just getting started — not sure yet", value: 'not_sure' },
  ]
  function toggle(val: string) {
    const cur = answers.race_distances
    if (val === 'not_sure') {
      update({ race_distances: cur.includes('not_sure') ? [] : ['not_sure'] })
      return
    }
    const without = cur.filter(v => v !== 'not_sure')
    update({ race_distances: without.includes(val) ? without.filter(v => v !== val) : [...without, val] })
  }
  return (
    <div className="space-y-3">
      <p className="text-[#6B7280] text-sm mb-5">Select all that apply.</p>
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} selected={answers.race_distances.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  )
}

function Step2({ answers, update }: { answers: WizardAnswers; update: (a: Partial<WizardAnswers>) => void }) {
  const options = [
    { label: 'This is my first season', value: 'first_season' },
    { label: '1–3 years', value: '1_3_years' },
    { label: '3+ years', value: '3_plus_years' },
    { label: "I come from another endurance sport and I'm new to tri", value: 'from_other_sport' },
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
          {TRIATHLON_COUNTRIES.map(c => (
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
  const options = [
    { label: 'Bike', value: 'bike' },
    { label: 'Wetsuit', value: 'wetsuit' },
    { label: 'Tri suit', value: 'tri_suit' },
    { label: 'GPS watch', value: 'gps_watch' },
    { label: 'Starting fresh — I\'m building from scratch', value: 'starting_fresh' },
  ]
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
      {options.map(o => (
        <OptionButton key={o.value} label={o.label} selected={answers.existing_gear.includes(o.value)} onClick={() => toggle(o.value)} />
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
  const hasLongDistance = answers.race_distances.some(d => ['70.3', 'ironman'].includes(d))

  return (
    <div className="space-y-8">
      {/* Body measurements */}
      <div>
        <h3 className="font-display text-2xl text-white mb-1">BODY MEASUREMENTS</h3>
        <p className="text-[#6B7280] text-sm mb-4">Stand with a soft tape measure. All fields optional.</p>
        <div className="space-y-4">
          <MeasurementInput label="Inseam length" tooltip="Floor to crotch along inside of leg" value={answers.inseam_inches} onChange={(v) => update({ inseam_inches: v })} />
          <MeasurementInput label="Torso length" tooltip="Base of neck (bony bump) down to top of hip bone" value={answers.torso_length_inches} onChange={(v) => update({ torso_length_inches: v })} />
          <MeasurementInput label="Arm length" tooltip="Tip of shoulder to wrist with arm slightly bent" value={answers.arm_length_inches} onChange={(v) => update({ arm_length_inches: v })} />
          <MeasurementInput label="Arm span" tooltip="Fingertip to fingertip with arms fully extended" value={answers.arm_span_inches} onChange={(v) => update({ arm_span_inches: v })} />
          <MeasurementInput label="Shoulder width" tooltip="Outer edge of one shoulder to the other across upper back" value={answers.shoulder_width_inches} onChange={(v) => update({ shoulder_width_inches: v })} />
          <MeasurementInput label="Chest circumference" tooltip="Around fullest part of chest, tape horizontal" value={answers.chest_circumference_inches} onChange={(v) => update({ chest_circumference_inches: v })} />
          <MeasurementInput label="Hip circumference" tooltip="Around fullest part of hips, about 8 inches below waist" value={answers.hip_circumference_inches} onChange={(v) => update({ hip_circumference_inches: v })} />
          <MeasurementInput label="Neck circumference" tooltip="Around base of neck where a shirt collar would sit" value={answers.neck_circumference_inches} onChange={(v) => update({ neck_circumference_inches: v })} />
        </div>
      </div>

      {/* Bike fit inputs — shown if athlete owns a bike or races long distance */}
      {(hasBike || hasLongDistance) && (
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
    </div>
  )
}

// ─── Step metadata ─────────────────────────────────────────────────────────────

const STEPS: { question: string }[] = [
  { question: 'What is your primary race distance?' },
  { question: 'How long have you been doing triathlon?' },
  { question: 'What sport or activity is your strongest background?' },
  { question: 'What is your gender?' },
  { question: 'What is your date of birth?' },
  { question: 'Where are you based?' },
  { question: 'What is your height?' },
  { question: 'What is your weight?' },
  { question: 'How would you describe your approach to gear spending?' },
  { question: 'Do you have any known fit issues we should factor in?' },
  { question: 'What triathlon gear do you already own?' },
  { question: 'Tell us about your racing profile.' },
  { question: 'Do you have a specific race in mind?' },
]

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animKey, setAnimKey] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>(INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isOptionalStep = step === 14
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

    const payload = {
      ...answers,
      fit_issues,
      existing_gear,
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

    const result = await saveProfile(payload)

    if (result?.error) {
      setSubmitError(result.error)
      setIsSubmitting(false)
    }
    // On success saveProfile calls redirect() — no need to handle here
  }

  const ready = canAdvance(step, answers)

  const slideClass = direction === 'forward'
    ? 'animate-slide-in-forward'
    : 'animate-slide-in-back'

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
              : STEPS[step - 1].question.toUpperCase()}
          </h1>

          {isOptionalStep && (
            <p className="text-[#D1D5DB] mb-6 text-sm leading-relaxed">
              These measurements help us match gear to your exact body proportions — especially for wetsuits, bikes, and tri suits. Takes about 5 minutes with a soft tape measure. You can skip this now and add measurements anytime from your profile.
            </p>
          )}

          {/* Render step */}
          {step === 1 && <Step1 answers={answers} update={update} />}
          {step === 2 && <Step2 answers={answers} update={update} />}
          {step === 3 && <Step3 answers={answers} update={update} />}
          {step === 4 && <Step4 answers={answers} update={update} />}
          {step === 5 && <Step5 answers={answers} update={update} />}
          {step === 6 && <Step6 answers={answers} update={update} />}
          {step === 7 && <Step7 answers={answers} update={update} />}
          {step === 8 && <Step8 answers={answers} update={update} />}
          {step === 9 && <Step9 answers={answers} update={update} />}
          {step === 10 && <Step10 answers={answers} update={update} />}
          {step === 11 && <Step11 answers={answers} update={update} />}
          {step === 12 && <Step12 answers={answers} update={update} />}
          {step === 13 && <Step13 answers={answers} update={update} />}
          {step === 14 && <Step14 answers={answers} update={update} />}
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
          {/* Skip button on step 14 only */}
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
          {step < 13 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!ready}
              className="bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              Continue
            </button>
          )}

          {step === 13 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!ready}
              className="bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              Continue
            </button>
          )}

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
