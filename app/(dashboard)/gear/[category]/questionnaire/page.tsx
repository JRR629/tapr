'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Answer = string | string[] | number | boolean
type Answers = Record<string, Answer>

interface SingleSelectProps {
  field: string
  options: string[]
  answers: Answers
  onChange: (field: string, value: string) => void
}

interface MultiSelectProps {
  field: string
  options: string[]
  answers: Answers
  onChange: (field: string, value: string) => void
}

// ---------------------------------------------------------------------------
// Reusable answer buttons
// ---------------------------------------------------------------------------

function SingleSelect({ field, options, answers, onChange }: SingleSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const selected = answers[field] === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(field, opt)}
            className={`bg-[#0A1628] border rounded-lg px-5 py-4 text-left transition-all cursor-pointer min-h-[52px] text-sm font-medium ${
              selected
                ? 'border-[#FF6B35] bg-[#FF6B3510] text-white scale-[1.01]'
                : 'border-[#1A3A5C] hover:border-[#FF6B35] text-[#D1D5DB]'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function MultiSelect({ field, options, answers, onChange }: MultiSelectProps) {
  const selected = (answers[field] as string[]) ?? []
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(field, opt)}
            className={`bg-[#0A1628] border rounded-lg px-5 py-4 text-left transition-all cursor-pointer min-h-[52px] text-sm font-medium flex items-center gap-3 ${
              isSelected
                ? 'border-[#FF6B35] bg-[#FF6B3510] text-white scale-[1.01]'
                : 'border-[#1A3A5C] hover:border-[#FF6B35] text-[#D1D5DB]'
            }`}
          >
            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
              isSelected ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-[#1A3A5C]'
            }`}>
              {isSelected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

interface TextInputProps {
  field: string
  placeholder: string
  answers: Answers
  onChange: (field: string, value: string) => void
}

function TextInput({ field, placeholder, answers, onChange }: TextInputProps) {
  return (
    <input
      type="text"
      value={(answers[field] as string) ?? ''}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] text-sm"
    />
  )
}

// ---------------------------------------------------------------------------
// Question definition
//
// FUTURE CATEGORY BUILDOUT NOTES:
// - Use type: 'multi' for any question where multiple answers legitimately apply
//   simultaneously (e.g. athlete races in multiple environments, has multiple
//   priorities, owns multiple devices). Multi requires at least 1 selection
//   unless also marked optional: true.
// - Use optional: true for questions where "I don't know" or "doesn't apply"
//   is a valid state. Optional questions do not block the Continue button and
//   show an "(optional)" label. The AI uses provided values as context and
//   ignores omitted optional fields — it must never treat a missing optional
//   answer as a negative signal, only as absent context.
// - Keep required questions to those that materially change the recommendation.
//   If removing a question would not change the top pick in >80% of scenarios,
//   make it optional or remove it entirely.
// ---------------------------------------------------------------------------

interface QuestionDef {
  field: string
  label: string
  type: 'single' | 'multi' | 'text'
  options?: string[]
  placeholder?: string
  optional?: boolean   // if true, field is skipped in completion check; shows "(optional)"
  showIf?: (a: Answers) => boolean
}

interface StepDef {
  title: string
  subtitle: string
  questions: QuestionDef[]
}

// ---------------------------------------------------------------------------
// Wetsuits questionnaire
// ---------------------------------------------------------------------------

const WETSUIT_STEPS: StepDef[] = [
  {
    title: 'Race Conditions',
    subtitle: 'Tell us about your race environment so we can match the right wetsuit.',
    questions: [
      {
        // Multi-select: athletes commonly race across multiple water environments
        // (e.g. local lake tri + destination ocean race in same season). Knowing
        // all conditions helps the AI recommend a versatile suit rather than one
        // optimised for a single scenario.
        field: 'water_type',
        label: 'What type of water will you be racing in? Select all that apply.',
        type: 'multi',
        options: [
          'Lake or reservoir — calm flatwater',
          'River — moving water, possible current',
          'Ocean or sea — open water, possible waves and surf',
          'Bay, intercoastal, or estuary — mixed conditions',
          'Indoor pool swim (wetsuit likely not allowed)',
          'Not sure yet',
        ],
      },
      {
        field: 'water_temp',
        label: 'What is the expected water temperature at your race?',
        type: 'single',
        options: [
          'Below 60°F / 15°C — very cold, thermal protection essential',
          '60–65°F / 15–18°C — cold, full wetsuit strongly recommended',
          '65–70°F / 18–21°C — cool, wetsuit beneficial',
          '70–76°F / 21–24°C — borderline — depends on race rules',
          'Above 76°F / 24°C — likely wetsuit illegal',
          "I don't know — help me figure this out",
        ],
      },
      {
        field: 'wetsuit_permitted',
        label: 'Are wetsuits permitted at your target race?',
        type: 'single',
        options: [
          'Yes, confirmed wetsuit legal',
          'No, wetsuit not permitted',
          'Not sure — I need help checking',
        ],
      },
      {
        field: 'swim_conditions',
        label: 'What are the expected swim conditions?',
        type: 'single',
        options: [
          'Calm flatwater — no waves or current',
          'Light chop — minor surface movement',
          'Significant waves or surf',
          'Meaningful river current (faster or slower than I swim)',
          'Unknown',
        ],
      },
    ],
  },
  {
    title: 'Sleeve Decision',
    subtitle: 'Sleeved vs sleeveless is one of the most important choices — let us help.',
    questions: [
      {
        field: 'sleeve_preference',
        label: 'Are you considering sleeved or sleeveless?',
        type: 'single',
        options: [
          'Full sleeve — I want maximum warmth and buoyancy',
          'Sleeveless — I want maximum shoulder freedom',
          "Help me decide — I'm not sure what's right for me",
          "I'm doing multiple races — help me understand the tradeoffs",
        ],
      },
      {
        field: 'shoulder_mobility',
        label: 'How would you describe your shoulder mobility?',
        type: 'single',
        options: [
          'Excellent — full range of motion, no restrictions',
          'Good — occasional tightness but not limiting',
          'Limited — I have meaningful shoulder tightness that affects my stroke',
          'Poor — shoulder restriction is a real problem for me in the water',
        ],
      },
    ],
  },
  {
    title: 'Swim Profile',
    subtitle: "Your swimming background shapes which wetsuit will actually help you on race day.",
    questions: [
      {
        field: 'swim_ability',
        label: 'How would you describe your swimming ability?',
        type: 'single',
        options: [
          'Beginner — swimming is my weakest discipline, I need all the help I can get',
          "Developing — I can complete the swim but it's not comfortable",
          'Intermediate — solid swimmer, finishing is not a concern',
          'Strong — swimming is my best or equal-best discipline',
        ],
      },
      {
        field: 'wetsuit_experience',
        label: 'Have you worn a triathlon wetsuit before?',
        type: 'single',
        options: [
          'Never worn one',
          'Worn a borrowed wetsuit',
          'I own one — looking to replace or upgrade',
        ],
      },
      {
        field: 'current_wetsuit_issue',
        label: 'If you own a wetsuit, what is your main issue with it?',
        type: 'single',
        showIf: (a: Answers) => a['wetsuit_experience'] === 'I own one — looking to replace or upgrade',
        options: [
          'It restricts my shoulder rotation and stroke',
          'Water flushes in at the neck or wrists',
          "It's difficult and slow to remove in transition",
          "It doesn't keep me warm enough",
          'No major issue — I just want an upgrade',
          'Other',
        ],
      },
      {
        // Optional: not every athlete knows how they thermoregulate in water,
        // especially first-timers. AI defaults to a balanced recommendation when
        // absent and uses body weight, swim pace, and race conditions as proxies.
        field: 'thermal_tendency',
        label: 'Do you tend to run hot or cold in water?',
        type: 'single',
        optional: true,
        options: [
          'Cold — I get cold easily and need thermal protection',
          "Neutral — I'm comfortable in a range of temperatures",
          'Hot — I overheat easily and prefer less insulation',
        ],
      },
      {
        field: 'owned_wetsuits',
        label: 'Which wetsuit(s) do you currently own? (brand and model)',
        type: 'text',
        placeholder: 'e.g. Zone3 Aspire, HUUB Aegis X 3:3',
        showIf: (a: Answers) => a['wetsuit_experience'] === 'I own one — looking to replace or upgrade',
      },
    ],
  },
  {
    title: 'Priorities & Budget',
    subtitle: 'Final details to lock in the perfect match.',
    questions: [
      {
        // Multi-select: athletes frequently have more than one priority —
        // e.g. flexibility AND easy removal matters equally to a fast swimmer.
        // Allowing multi-select gives the AI richer signal to weight tradeoffs.
        field: 'priority',
        label: 'What matters most to you in a wetsuit? Select all that apply.',
        type: 'multi',
        options: [
          'Buoyancy — I need help staying horizontal and afloat',
          "Flexibility — I don't want my stroke restricted at all",
          'Speed — I want the fastest hydrodynamic advantage',
          'Easy removal — transition speed is a priority',
          'Value — best performance per dollar',
        ],
      },
      {
        // Optional: useful for durability weighting but not a recommendation
        // blocker. AI defaults to a balanced durability recommendation when absent.
        field: 'uses_per_season',
        label: 'How many times per season will you use this wetsuit?',
        type: 'single',
        optional: true,
        options: [
          '1–2 races only',
          '3–5 races',
          '6+ races',
          "I'll also train in it regularly",
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// GPS Watches questionnaire
// ---------------------------------------------------------------------------

const GPS_WATCH_STEPS: StepDef[] = [
  {
    title: 'Race & Watch Type',
    subtitle: 'Help us understand how you plan to use your GPS watch.',
    questions: [
      {
        field: 'triathlon_mode',
        label: 'Do you need a watch with a dedicated triathlon mode?',
        type: 'single',
        options: [
          'Yes — I need triathlon mode (swim → bike → run sequencing)',
          'No — I primarily run or cycle, not racing tri yet',
          'Not sure — explain and recommend',
        ],
      },
      {
        field: 'watch_type',
        label: 'What type of watch are you looking for?',
        type: 'single',
        options: [
          'Dedicated sports/triathlon watch — performance and accuracy first',
          'Balanced — solid sports features AND everyday smartwatch usability',
          'Primarily a smartwatch — sports tracking is secondary',
          'I wear an Apple Watch and want to know if it works for triathlon',
        ],
      },
      {
        field: 'longest_event',
        label: "What is the longest event you'll use this watch for?",
        type: 'single',
        options: [
          'Sprint triathlon — under 2 hours',
          'Olympic triathlon — 2–3 hours',
          '70.3 Half Ironman — 4–7 hours',
          'Full Ironman — 9–17 hours',
          'Ultra-distance events — 17+ hours',
        ],
      },
    ],
  },
  {
    title: 'Technical Requirements',
    subtitle: 'What features matter most for how you train and race?',
    questions: [
      {
        field: 'power_meter',
        label: 'Do you use a power meter on your bike?',
        type: 'single',
        options: [
          'Yes — I need the watch to display and record power data',
          "No, but I'm planning to get one",
          "No and I don't plan to",
        ],
      },
      {
        // Multi-bike: meaningful differentiator across watches. Athletes with
        // a road bike + TT/tri bike need reliable multi-profile management so
        // sensor pairings, calibration, and bike fit data persist per bike.
        // Garmin handles this best (saved bike profiles in Garmin Connect,
        // persistent power meter calibration per profile). COROS and Polar are
        // solid. Apple Watch requires manual sensor management — notable gap
        // for multi-bike athletes.
        //
        // FUTURE CATEGORY NOTE: bikes questionnaire should ask this too and
        // cross-reference with the athlete's watch selection where available.
        field: 'multi_bike_setup',
        label: 'Do you train or race with more than one bike?',
        type: 'single',
        options: [
          'Yes — I have multiple bikes (e.g. road + TT or tri bike) with separate sensor setups',
          'Yes — I ride outdoors and also use a smart trainer indoors',
          'No — single bike setup',
        ],
      },
      {
        // Optional: athletes may not know whether they will use a chest strap,
        // or may not own one. Wrist HR is sufficient for many age-groupers.
        // AI uses this to weight HR accuracy notes in the recommendation.
        field: 'chest_strap_hr',
        label: 'Do you train with a chest strap heart rate monitor?',
        type: 'single',
        optional: true,
        options: [
          'Yes — I rely on chest strap accuracy for training zones',
          'No — wrist-based HR is sufficient for me',
          'Not currently but open to it',
        ],
      },
      {
        field: 'navigation_importance',
        label: 'How important is navigation and mapping?',
        type: 'single',
        options: [
          'Essential — I regularly ride or run new routes and need turn-by-turn',
          'Useful — occasionally helpful for new routes',
          'Not important — I train on familiar routes',
        ],
      },
      {
        // Optional: recovery metrics matter significantly to some athletes and
        // not at all to others. Absence signals the AI to deprioritise wellness
        // platform depth in its comparison notes — not to penalise any watch.
        field: 'recovery_metrics',
        label: 'How important are recovery and wellness metrics?',
        type: 'single',
        optional: true,
        options: [
          'Very — I want HRV, body battery, sleep tracking, and stress scores',
          'Somewhat — nice to have alongside training data',
          'Not important — I just want training and race metrics',
        ],
      },
    ],
  },
  {
    title: 'Ecosystem & Preferences',
    subtitle: 'A few final details to dial in your recommendation.',
    questions: [
      {
        // Optional multi-select: helpful ecosystem context but not required.
        // Garmin Edge pairing, Wahoo compatibility, Zwift integration, and
        // phone OS all influence which watch fits best — but an athlete with
        // no existing ecosystem can still get a strong recommendation.
        //
        // FUTURE CATEGORY NOTE: running shoes and accessories questionnaires
        // do not need ecosystem questions. Bikes questionnaire should include
        // a parallel question about existing components (groupset, power meter
        // brand) since compatibility matters for bike computer/watch pairing.
        field: 'current_devices',
        label: 'What devices do you currently own? Select all that apply.',
        type: 'multi',
        optional: true,
        options: [
          'Garmin Edge cycling computer',
          'Wahoo cycling computer',
          'Apple iPhone',
          'Android phone',
          'Zwift or smart trainer setup',
          'Whoop or Oura ring',
          'No specific ecosystem',
        ],
      },
      {
        // Optional: a strong preference meaningfully narrows the field, but
        // most athletes without a preference are better served by an objective
        // recommendation. Never penalise a brand for not being the preference —
        // surface preference as a tiebreaker, not an exclusion filter.
        field: 'brand_preference',
        label: 'Do you have a preference for brand?',
        type: 'single',
        optional: true,
        options: [
          'Garmin — already in the ecosystem or prefer it',
          'COROS — heard good things or prefer the value',
          'Polar — prefer Polar training science and metrics',
          'Suunto — prefer Suunto design or features',
          'Apple — want Apple Watch',
          'No preference — recommend the best for my needs',
        ],
      },
      {
        // Shown when any Apple signal is detected: Apple Watch selected in
        // watch_type, Apple selected in brand_preference, OR Apple iPhone
        // selected in current_devices. iPhone ownership is included because
        // iPhone users tend to be deeply embedded in the Apple ecosystem
        // (Health app, iCloud, AirDrop sharing of workouts, Siri shortcuts)
        // even if they haven't explicitly said they want an Apple Watch.
        //
        // AI instruction: if athlete selects "stay in Apple ecosystem",
        // recommend Apple Watch Ultra 3 as top pick with honest triathlon
        // caveats (multi-bike profile limits, transition management, power
        // meter display gaps vs Garmin). Surface the best dedicated tri watch
        // as the runner-up, framed as "what you'd get if you opened the field."
        // If athlete selects "open to all", treat brand_preference = Apple as
        // a tiebreaker only — not an exclusion filter.
        //
        // FUTURE CATEGORY NOTE: this question is GPS watches only. Running and
        // swimming categories should NOT include this question — Apple Watch
        // competes on merit in those categories without needing a separate
        // pathway. Cycling (future) may warrant a version of this question
        // focused on head unit vs wrist watch preference rather than ecosystem.
        field: 'apple_ecosystem_preference',
        label: 'Looks like you\'re in the Apple ecosystem — do you want to stay there, or are you open to dedicated triathlon watches?',
        type: 'single',
        showIf: (a: Answers) => {
          const watchType = a['watch_type'] as string | undefined
          const brandPref = a['brand_preference'] as string | undefined
          const devices = (a['current_devices'] as string[]) ?? []
          return (
            watchType === 'I wear an Apple Watch and want to know if it works for triathlon' ||
            brandPref === 'Apple — want Apple Watch' ||
            devices.includes('Apple iPhone')
          )
        },
        options: [
          'Open to all — show me the best watch for my goals regardless of brand',
          'Stay in Apple — show me the best Apple Watch option with honest triathlon tradeoffs',
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

const CATEGORY_STEPS: Record<string, StepDef[]> = {
  wetsuits: WETSUIT_STEPS,
  'gps-watches': GPS_WATCH_STEPS,
  // Add new categories here as they launch. Each category needs:
  //   1. A StepDef[] constant above
  //   2. An entry in CATEGORY_BUDGET_LABELS
  //   3. An entry in CATEGORY_BUDGET_DEFAULTS
  // No other changes required — the guard and rendering handle the rest.
}

const CATEGORY_BUDGET_LABELS: Record<string, string> = {
  wetsuits: 'What is your budget for this wetsuit?',
  'gps-watches': 'What is your budget for a GPS watch?',
}

const CATEGORY_BUDGET_DEFAULTS: Record<string, { min: number; max: number }> = {
  wetsuits: { min: 200, max: 600 },
  'gps-watches': { min: 0, max: 800 },
}

// ---------------------------------------------------------------------------
// Budget input
// ---------------------------------------------------------------------------

interface BudgetInputProps {
  valueMin: number
  valueMax: number
  noLimit: boolean
  onChangeMin: (v: number) => void
  onChangeMax: (v: number) => void
  onToggleNoLimit: (v: boolean) => void
}

function BudgetInput({ valueMin, valueMax, noLimit, onChangeMin, onChangeMax, onToggleNoLimit }: BudgetInputProps) {
  function handleMinText(raw: string) {
    const v = parseInt(raw.replace(/\D/g, ''), 10)
    onChangeMin(isNaN(v) ? 0 : v)
  }

  function handleMaxText(raw: string) {
    const v = parseInt(raw.replace(/\D/g, ''), 10)
    if (!isNaN(v) && v > valueMin) onChangeMax(v)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <p className="text-[#6B7280] text-xs mb-1.5">Min</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-mono text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={valueMin === 0 ? '0' : valueMin}
              onChange={(e) => handleMinText(e.target.value)}
              className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white font-mono font-semibold text-lg rounded-md pl-7 pr-3 py-2.5 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all text-center"
            />
          </div>
        </div>
        <div className="text-[#6B7280] text-sm pb-3">to</div>
        <div className="flex-1">
          <p className="text-[#6B7280] text-xs mb-1.5">Max</p>
          <div className="relative">
            {!noLimit && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-mono text-sm">$</span>
            )}
            <input
              type="text"
              inputMode="numeric"
              value={noLimit ? 'No limit' : valueMax}
              onChange={(e) => { if (!noLimit) handleMaxText(e.target.value) }}
              readOnly={noLimit}
              className={`w-full bg-[#0A1628] border rounded-md py-2.5 font-mono font-semibold text-lg transition-all text-center focus:outline-none ${
                noLimit
                  ? 'border-[#22C55E] text-[#22C55E] cursor-default'
                  : 'border-[#1A3A5C] text-white pl-7 pr-3 focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)]'
              }`}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggleNoLimit(!noLimit)}
        className={`flex items-center gap-2 text-sm transition-colors ${
          noLimit ? 'text-[#22C55E]' : 'text-[#6B7280] hover:text-white'
        }`}
      >
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
          noLimit ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#1A3A5C]'
        }`}>
          {noLimit && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        No upper limit — show me the best option regardless of price
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface QuestionnairePageProps {
  params: { category: string }
}

export default function QuestionnairePage({ params }: QuestionnairePageProps) {
  const { category } = params
  const router = useRouter()

  const budgetDefaults = CATEGORY_BUDGET_DEFAULTS[category] ?? { min: 200, max: 600 }

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [budgetMin, setBudgetMin] = useState(budgetDefaults.min)
  const [budgetMax, setBudgetMax] = useState(budgetDefaults.max)
  const [budgetNoLimit, setBudgetNoLimit] = useState(true)

  const steps = CATEGORY_STEPS[category]

  if (!steps) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-[#0F2040] border border-dashed border-[#1A3A5C] rounded-lg p-10 text-center max-w-md opacity-60">
          <p className="font-display text-3xl text-white mb-3">COMING SOON</p>
          <p className="text-[#6B7280] text-sm leading-relaxed">
            The {category.replace(/-/g, ' ')} questionnaire is launching soon. Check back after the next category update.
          </p>
        </div>
      </div>
    )
  }

  const totalSteps = steps.length
  const currentGroup = steps[step]
  const isLastStep = step === totalSteps - 1
  const budgetLabel = CATEGORY_BUDGET_LABELS[category] ?? 'What is your budget?'

  function handleSingleChange(field: string, value: string) {
    setAnswers((prev) => {
      const next = { ...prev, [field]: value }
      // Clear answers for any conditional question now hidden
      for (const group of steps) {
        for (const q of group.questions) {
          if (q.showIf && !q.showIf(next) && next[q.field] !== undefined) {
            delete next[q.field]
          }
        }
      }
      return next
    })
  }

  function handleMultiChange(field: string, value: string) {
    setAnswers((prev) => {
      const current = (prev[field] as string[]) ?? []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      const next = { ...prev, [field]: updated }
      // Clear answers for any conditional question now hidden
      for (const group of steps) {
        for (const q of group.questions) {
          if (q.showIf && !q.showIf(next) && next[q.field] !== undefined) {
            delete next[q.field]
          }
        }
      }
      return next
    })
  }

  function isStepComplete(): boolean {
    for (const q of currentGroup.questions) {
      if (q.showIf && !q.showIf(answers)) continue
      if (q.optional) continue
      if (q.type === 'text') continue
      if (q.type === 'multi') {
        const val = answers[q.field] as string[] | undefined
        if (!val || val.length === 0) return false
        continue
      }
      if (!answers[q.field]) return false
    }
    return true
  }

  function handleNext() {
    if (isLastStep) {
      sessionStorage.setItem('trikit_layer2_responses', JSON.stringify({ ...answers }))
      sessionStorage.setItem('trikit_budget', JSON.stringify({ min: budgetMin, max: budgetNoLimit ? 999999 : budgetMax }))
      router.push(`/gear/${category}/recommendation`)
    } else {
      setStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const progressPercent = ((step + 1) / totalSteps) * 100

  return (
    <div className="flex-1 p-6 md:p-8 max-w-xl mx-auto w-full">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide">
            Step {step + 1} of {totalSteps}
          </span>
          <span className="text-[#6B7280] text-xs">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 bg-[#1A3A5C] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6B35] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step header */}
      <div className="mb-7">
        <h1 className="font-display text-4xl md:text-5xl text-white leading-tight mb-2">
          {currentGroup.title.toUpperCase()}
        </h1>
        <p className="text-[#6B7280] text-sm leading-relaxed">{currentGroup.subtitle}</p>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-7">
        {currentGroup.questions.map((q) => {
          if (q.showIf && !q.showIf(answers)) return null
          return (
            <div key={q.field}>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-white font-medium text-sm leading-snug">{q.label}</p>
                {q.optional && (
                  <span className="text-[#6B7280] text-xs font-normal flex-shrink-0">(optional)</span>
                )}
              </div>
              {q.type === 'text' ? (
                <TextInput
                  field={q.field}
                  placeholder={q.placeholder ?? ''}
                  answers={answers}
                  onChange={handleSingleChange}
                />
              ) : q.type === 'multi' ? (
                <MultiSelect
                  field={q.field}
                  options={q.options ?? []}
                  answers={answers}
                  onChange={handleMultiChange}
                />
              ) : (
                <SingleSelect
                  field={q.field}
                  options={q.options ?? []}
                  answers={answers}
                  onChange={handleSingleChange}
                />
              )}
            </div>
          )
        })}

        {/* Budget input — last step only */}
        {isLastStep && (
          <div>
            <p className="text-white font-medium text-sm mb-3">{budgetLabel}</p>
            <BudgetInput
              valueMin={budgetMin}
              valueMax={budgetMax}
              noLimit={budgetNoLimit}
              onChangeMin={setBudgetMin}
              onChangeMax={setBudgetMax}
              onToggleNoLimit={setBudgetNoLimit}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-10">
        {step === 0 ? (
          <button
            type="button"
            onClick={() => router.push(`/gear/${category}`)}
            className="flex items-center gap-2 border border-[#1A3A5C] hover:border-[#FF6B35] text-[#6B7280] hover:text-white px-5 py-3 rounded-md transition-all min-h-[44px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Exit
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-5 py-3 rounded-md transition-all hover:scale-[1.01] min-h-[44px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={!isStepComplete()}
          className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A24] disabled:bg-[#FF6B3550] disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
        >
          {isLastStep ? 'Get My Recommendation' : 'Continue'}
          {!isLastStep && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
