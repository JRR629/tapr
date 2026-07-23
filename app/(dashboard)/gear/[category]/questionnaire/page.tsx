'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { DISTANCE_LABELS } from '@/lib/sports'
import { useAthleteProfile } from '@/hooks/useAthleteProfile'

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
  // Optional grouped rendering. When provided, options are rendered in
  // two-column (≥sm) / stacked (<sm) sections with a small uppercase header
  // per group. The flat `options` prop is still expected to contain the union
  // of all group options — used for any callers that need to iterate the full
  // option list (handleMultiChange, isStepComplete, etc.). Engine sees the
  // raw selected strings; grouping is purely visual.
  optionGroups?: Array<{ label: string; options: string[] }>
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
            aria-pressed={selected}
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

function MultiSelect({ field, options, answers, onChange, optionGroups }: MultiSelectProps) {
  const selected = (answers[field] as string[]) ?? []

  // Single shared button render — used by both flat and grouped paths so they
  // look identical except for layout container.
  const renderOption = (opt: string) => {
    const isSelected = selected.includes(opt)
    return (
      <button
        key={opt}
        type="button"
        aria-pressed={isSelected}
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
  }

  // Grouped layout: 2-column (≥sm) / stacked (<sm) sections with a small
  // uppercase header per group. Used by race_distances_for_shoes to display
  // RUNNING vs TRIATHLON columns without making the user scan 8 flat options.
  if (optionGroups && optionGroups.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
        {optionGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="text-[#6B7280] text-[11px] uppercase tracking-widest font-semibold mb-1">
              {group.label}
            </p>
            {group.options.map(renderOption)}
          </div>
        ))}
      </div>
    )
  }

  // Flat layout — default behavior, unchanged from prior implementation.
  return (
    <div className="flex flex-col gap-2">
      {options.map(renderOption)}
    </div>
  )
}

interface BrandSentimentPickerProps {
  brands: string[]
  preferredField: string
  avoidedField: string
  answers: Answers
  onChange: (preferredField: string, avoidedField: string, preferred: string[], avoided: string[]) => void
}

type BrandSentiment = 'like' | 'neutral' | 'dislike'

function BrandSentimentPicker({ brands, preferredField, avoidedField, answers, onChange }: BrandSentimentPickerProps) {
  const preferred = (answers[preferredField] as string[]) ?? []
  const avoided = (answers[avoidedField] as string[]) ?? []

  function getSentiment(brand: string): BrandSentiment {
    if (preferred.includes(brand)) return 'like'
    if (avoided.includes(brand)) return 'dislike'
    return 'neutral'
  }

  function setSentiment(brand: string, sentiment: BrandSentiment) {
    const nextPreferred = sentiment === 'like'
      ? [...preferred.filter(b => b !== brand), brand]
      : preferred.filter(b => b !== brand)
    const nextAvoided = sentiment === 'dislike'
      ? [...avoided.filter(b => b !== brand), brand]
      : avoided.filter(b => b !== brand)
    onChange(preferredField, avoidedField, nextPreferred, nextAvoided)
  }

  return (
    <div className="flex flex-col divide-y divide-[#1A3A5C] border border-[#1A3A5C] rounded-lg overflow-hidden">
      {brands.map((brand) => {
        const sentiment = getSentiment(brand)
        return (
          <div key={brand} className="flex items-center justify-between px-4 py-3 bg-[#0A1628] min-h-[52px]">
            <span className={`text-sm font-medium transition-colors ${
              sentiment === 'like' ? 'text-[#FF6B35]' :
              sentiment === 'dislike' ? 'text-[#6B7280]' :
              'text-[#D1D5DB]'
            }`}>
              {brand}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSentiment(brand, sentiment === 'dislike' ? 'neutral' : 'dislike')}
                className={`flex items-center justify-center w-9 h-9 rounded-md border transition-all ${
                  sentiment === 'dislike'
                    ? 'border-[#EF4444] bg-[#EF444415] text-[#EF4444]'
                    : 'border-[#1A3A5C] text-[#6B7280] hover:border-[#EF4444] hover:text-[#EF4444]'
                }`}
                aria-label={`Dislike ${brand}`}
                aria-pressed={sentiment === 'dislike'}
              >
                <ThumbsDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => setSentiment(brand, 'neutral')}
                className={`flex items-center justify-center w-9 h-9 rounded-md border transition-all ${
                  sentiment === 'neutral'
                    ? 'border-[#1A3A5C] bg-[#1A3A5C20] text-[#D1D5DB]'
                    : 'border-[#1A3A5C] text-[#6B7280] hover:border-[#6B7280] hover:text-[#D1D5DB]'
                }`}
                aria-label={`Neutral on ${brand}`}
                aria-pressed={sentiment === 'neutral'}
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={() => setSentiment(brand, sentiment === 'like' ? 'neutral' : 'like')}
                className={`flex items-center justify-center w-9 h-9 rounded-md border transition-all ${
                  sentiment === 'like'
                    ? 'border-[#FF6B35] bg-[#FF6B3515] text-[#FF6B35]'
                    : 'border-[#1A3A5C] text-[#6B7280] hover:border-[#FF6B35] hover:text-[#FF6B35]'
                }`}
                aria-label={`Like ${brand}`}
                aria-pressed={sentiment === 'like'}
              >
                <ThumbsUp size={14} />
              </button>
            </div>
          </div>
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
  type: 'single' | 'multi' | 'text' | 'brand_sentiment'
  options?: string[]
  placeholder?: string
  optional?: boolean   // if true, field is skipped in completion check; shows "(optional)"
  showIf?: (a: Answers) => boolean
  // For brand_sentiment only: the secondary field that receives the disliked brands.
  // The primary field receives liked brands; this field receives disliked brands.
  secondaryField?: string
  // For multi-select only: cap selections to this count. Renders a hint after
  // the label ("select up to N"). When the cap is reached, clicking another
  // option is a no-op (user must deselect one first). Toggling off an already-
  // selected option always works regardless of the cap.
  maxSelect?: number
  // For multi-select only: render options in labeled groups (2-column on ≥sm,
  // stacked on <sm) instead of a flat list. The flat `options` array should
  // still contain the union of all group options — used by handleMultiChange
  // / isStepComplete iteration. Engine sees the same selected strings either
  // way; this is purely visual organization for questions where the options
  // partition into recognizable subgroups (e.g. RUNNING vs TRIATHLON
  // distances). Use for ≥6 options with a natural 2-way taxonomy.
  optionGroups?: Array<{ label: string; options: string[] }>
}

interface StepDef {
  title: string
  subtitle: string
  questions: QuestionDef[]
  // If set and returns false, the entire step is removed from navigation —
  // not just its inner questions. Useful when a whole step's relevance
  // depends on a prior answer (e.g. Race-day Details is irrelevant for
  // daily-training users).
  stepShowIf?: (a: Answers) => boolean
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
        label: 'Have you worn a wetsuit before?',
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
        // TODO: Conditional rendering — only show if profile.sports includes 'triathlon'
        // Currently requires passing profile to this client component (architectural change needed)
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
        field: 'race_distances_for_watch',
        label: 'What distances will you train for or race? Select all that apply.',
        type: 'multi',
        // Flat `options` union used by handleMultiChange / isStepComplete.
        // Visual rendering uses `optionGroups` below.
        options: [
          'Sprint triathlon (under 2 hr)',
          'Olympic triathlon (2–3 hr)',
          '70.3 Half-Iron (5–7 hr)',
          'Full Ironman (10–17 hr)',
          'Ultra triathlon (17+ hr)',
          '5K or 10K',
          'Half marathon',
          'Marathon',
          'Ultramarathon (50K+)',
          'Cycling under 4 hours',
          'Cycling 4–10 hours',
          'Cycling 10+ hours',
        ],
        optionGroups: [
          {
            label: 'Triathlon',
            options: [
              'Sprint triathlon (under 2 hr)',
              'Olympic triathlon (2–3 hr)',
              '70.3 Half-Iron (5–7 hr)',
              'Full Ironman (10–17 hr)',
              'Ultra triathlon (17+ hr)',
            ],
          },
          {
            label: 'Running',
            options: [
              '5K or 10K',
              'Half marathon',
              'Marathon',
              'Ultramarathon (50K+)',
            ],
          },
          {
            label: 'Cycling',
            options: [
              'Cycling under 4 hours',
              'Cycling 4–10 hours',
              'Cycling 10+ hours',
            ],
          },
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
// Running Shoes questionnaire
// ---------------------------------------------------------------------------

const SHOE_BRAND_LIST = [
  'HOKA', 'Nike', 'ASICS', 'Brooks', 'Saucony', 'New Balance',
  'adidas', 'Puma', 'Mizuno', 'On', 'Altra', 'Topo Athletic', 'Skechers',
]

const RUNNING_SHOES_STEPS: StepDef[] = [
  {
    // Step 1 — Running Profile
    // Establishes surface, mileage load, and primary use — the three inputs
    // that determine which shoe category (daily trainer, racer, trail) is
    // relevant before foot mechanics are even considered.
    title: 'Running Profile',
    subtitle: 'Tell us how you train and what surfaces you run on.',
    questions: [
      {
        field: 'running_surface',
        label: 'What surfaces do you primarily run on? Select all that apply.',
        type: 'multi',
        // ⚠️ "Technical trail" intentionally REMOVED 2026-06-07 — Tapr's V1 catalog covers
        // road shoes and road-trail crossover only (no technical trail / dedicated trail shoes).
        // Offering this option would mislead users into selecting a use case we can't serve well.
        // ADD IT BACK when (a) a Trail Shoes category is launched OR (b) the running-shoes
        // catalog explicitly includes technical-trail SKUs (Speedgoat, Mafate, etc.).
        // The "Technical trail" hard-disqualifier branch in lib/anthropic.ts:790-797 stays in
        // place so it activates immediately if/when the option returns.
        options: [
          'Road',
          'Track',
          'Light trail',
          'Treadmill primarily',
          'Mixed road and trail',
        ],
      },
      {
        field: 'weekly_mileage',
        label: 'What is your approximate weekly running mileage?',
        type: 'single',
        options: [
          'Under 15 miles / 25km per week',
          '15–30 miles / 25–50km per week',
          '30–50 miles / 50–80km per week',
          '50+ miles / 80km+ per week',
        ],
      },
      {
        field: 'primary_use',
        label: 'What will you primarily use these shoes for? Select all that apply.',
        type: 'multi',
        options: [
          'Daily training runs',
          'Long runs and endurance training',
          'Speed work and tempo runs',
          'Racing',
        ],
      },
    ],
  },
  {
    // Step 2 — Foot Mechanics
    // foot_strike, overpronation, arch_type (Layer 1 prefill), injuries.
    // arch_type is prefilled from athlete_profiles if non-null; override
    // writes back to athlete_profiles via PATCH.
    title: 'Foot Mechanics',
    subtitle: 'Understanding how your foot moves helps us avoid injury-causing mismatches.',
    questions: [
      {
        field: 'foot_strike',
        label: 'Do you know your foot strike pattern?',
        type: 'single',
        options: [
          'Heel striker',
          'Midfoot striker',
          'Forefoot striker',
          'Not sure',
        ],
      },
      {
        field: 'overpronation',
        label: 'Do you know if you overpronate?',
        type: 'single',
        options: [
          'Yes, I overpronate',
          'Yes, I supinate',
          'Neutral',
          'Not sure',
        ],
      },
      {
        // Layer 1 prefill: arch_type is synced with athlete_profiles.arch_type.
        // On load, if profile.arch_type is non-null the field is pre-answered and
        // a "From your profile" badge is shown. If user changes it and submits,
        // a PATCH is issued to update athlete_profiles so Layer 1 stays current.
        field: 'arch_type',
        label: 'How would you describe your arch type?',
        type: 'single',
        options: [
          'Flat feet or low arch',
          'Neutral arch',
          'High arch',
          'Not sure',
        ],
      },
      {
        field: 'injuries',
        label: 'Do you have any existing foot, knee, or lower leg injuries or conditions? Select all that apply.',
        type: 'multi',
        options: [
          'Plantar fasciitis',
          'IT band syndrome',
          'Shin splints',
          'Achilles tendinopathy',
          'Knee pain',
          'Morton\'s neuroma or toe issues',
          'No current issues',
        ],
      },
    ],
  },
  {
    // Step 3 — Fit Preferences
    // foot_width (Layer 1 prefill), shoe_priority, heel_drop, carbon_plate_preference.
    // foot_width prefill behavior is identical to arch_type above.
    title: 'Fit Preferences',
    subtitle: 'Narrow down the fit and feel you need from a running shoe.',
    questions: [
      {
        // Layer 1 prefill: foot_width synced from athlete_profiles.foot_width.
        // Same prefill + write-back behavior as arch_type.
        field: 'foot_width',
        label: 'How wide are your feet?',
        type: 'single',
        options: [
          'Narrow',
          'Standard / medium',
          'Wide',
          'Extra wide',
        ],
      },
      {
        field: 'shoe_priority',
        label: 'What do you prioritize in a running shoe?',
        type: 'multi',
        maxSelect: 2,
        options: [
          'Cushioning',
          'Responsiveness',
          'Stability',
          'Durability',
          'Lightweight',
        ],
      },
      {
        field: 'heel_drop',
        label: 'How much heel drop do you prefer?',
        type: 'single',
        options: [
          'Low drop (0–4mm)',
          'Medium drop (5–8mm)',
          'High drop (9mm+)',
          'No preference or not sure',
        ],
      },
      {
        // Always shown — gate for carbon plate filtering in the prompt engine.
        // Avoidance is a hard remove in filterRunningShoeProductsForPrompt.
        field: 'carbon_plate_preference',
        label: 'How do you feel about carbon-plated shoes?',
        type: 'single',
        options: [
          'Yes — I specifically want a carbon-plated shoe considered',
          'Open to carbon-plated shoes',
          'Prefer to avoid carbon plates (cost, discomfort, durability, or any reason)',
          'No preference — recommend what\'s best for my needs',
        ],
      },
    ],
  },
  {
    // Step 4 — Brand History
    // preferred_brands and avoided_brands drive soft scoring and hard-removes
    // respectively in filterRunningShoeProductsForPrompt. brand_history_notes
    // is free-text context passed verbatim to Claude.
    // UI: single-pass brand_sentiment picker (like/neutral/dislike per brand)
    // maps to preferred_brands + avoided_brands — no duplicate scrolling.
    title: 'Brand History',
    subtitle: 'Rate each brand based on your experience. Skip any you haven\'t tried.',
    questions: [
      {
        field: 'preferred_brands',
        label: 'How do you feel about these brands?',
        type: 'brand_sentiment',
        secondaryField: 'avoided_brands',
        optional: true,
        options: SHOE_BRAND_LIST,
      },
      {
        field: 'brand_history_notes',
        label: 'Anything else about brands worth knowing?',
        type: 'text',
        placeholder: 'e.g. "Nike always runs narrow on me" or "HOKA Bondi worked great for long runs"',
        optional: true,
      },
    ],
  },
  {
    // Step 5 — Race-day Details (conditional)
    // Entire step is skipped (not just inner questions) when the user isn't
    // racing — see stepShowIf below. race_pace_intent has a secondary
    // conditional: only shown when race_distances_for_shoes includes a
    // half marathon, marathon, or ultra.
    title: 'Race-day Details',
    subtitle: 'Racing-specific inputs help us find the right shoe for your pace and event.',
    stepShowIf: (a: Answers) =>
      Array.isArray(a['primary_use']) && (a['primary_use'] as string[]).includes('Racing'),
    questions: [
      {
        field: 'race_distances_for_shoes',
        label: 'What distances will you be racing in these shoes? Select all that apply.',
        type: 'multi',
        showIf: (a: Answers) =>
          Array.isArray(a['primary_use']) && (a['primary_use'] as string[]).includes('Racing'),
        // `options` is the union of both groups — used by handleMultiChange
        // and isStepComplete iteration. Visual rendering uses `optionGroups`
        // below to split into RUNNING vs TRIATHLON sections.
        options: [
          '5K / 10K',
          'Half marathon',
          'Marathon',
          'Ultramarathon (50K+ road or road-trail)',
          'Sprint triathlon',
          'Olympic triathlon',
          '70.3 Ironman',
          'Full Ironman',
        ],
        optionGroups: [
          {
            label: 'Running',
            options: [
              '5K / 10K',
              'Half marathon',
              'Marathon',
              'Ultramarathon (50K+ road or road-trail)',
            ],
          },
          {
            label: 'Triathlon',
            options: [
              'Sprint triathlon',
              'Olympic triathlon',
              '70.3 Ironman',
              'Full Ironman',
            ],
          },
        ],
      },
      {
        field: 'race_legality_requirement',
        label: 'Does your race require World Athletics legal footwear (≤40mm stack, ≤1 plate)?',
        type: 'single',
        showIf: (a: Answers) =>
          Array.isArray(a['primary_use']) && (a['primary_use'] as string[]).includes('Racing'),
        options: [
          'Yes — must be World Athletics legal (≤40mm stack, ≤1 plate)',
          'No — not racing at qualifying level',
          'Not sure',
        ],
      },
      {
        // Additionally conditional: only shown when race_distances_for_shoes
        // contains a long-distance race. Running half/full/ultra and the
        // triathlon long-course events (70.3 / Full Ironman) all qualify
        // because their run leg is the same distance (13.1mi and 26.2mi
        // respectively). Sprint/Olympic tri and 5K/10K are excluded — pace
        // intent is less differentiating at those distances.
        field: 'race_pace_intent',
        label: 'What is your pace intent for the longer distances?',
        type: 'single',
        showIf: (a: Answers) => {
          if (!Array.isArray(a['primary_use']) || !(a['primary_use'] as string[]).includes('Racing')) return false
          const distances = (a['race_distances_for_shoes'] as string[]) ?? []
          return distances.some(
            (d) =>
              d.includes('Half marathon') ||
              d.includes('Marathon') ||
              d.includes('Ultramarathon') ||
              d.includes('70.3 Ironman') ||
              d.includes('Full Ironman')
          )
        },
        options: [
          'Fast — chasing a competitive time (sub-1:40 half, sub-3:30 marathon)',
          'Solid effort — pace matters but not critical (1:40–2:10 half, 3:30–4:30 marathon)',
          'Just completing the distance (2:10+ half, 4:30+ marathon, or ultra-style finish-focused)',
        ],
      },
    ],
  },
  {
    // Step 6 — Rotation Intent
    // Always shown. Gates rotationSuggestion in the output — "one shoe to
    // cover everything" = rotationSuggestion never populated. Budget also
    // lives on this last step.
    title: 'Rotation Intent',
    subtitle: 'Are you looking for one shoe to do it all, or building a rotation?',
    questions: [
      {
        field: 'rotation_intent',
        label: 'What is your shoe rotation plan?',
        type: 'single',
        options: [
          'Looking for one shoe to cover everything',
          'Open to a small rotation (2–3 shoes) if it\'s justified',
          'I already have a rotation and need to fill a gap',
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Nutrition questionnaire
// ---------------------------------------------------------------------------

const NUTRITION_STEPS: StepDef[] = [
  {
    title: 'Race Context',
    subtitle: 'Tell us about your event so we can match the right nutrition strategy.',
    questions: [
      {
        field: 'fueling_for',
        label: 'What are you fueling for?',
        type: 'single',
        options: ['Triathlon', 'Running', 'Cycling', 'Swimming'],
      },
      {
        field: 'race_duration',
        label: 'How long will you be racing or training for this nutrition strategy?',
        type: 'single',
        options: [
          'Under 1 hour',
          '1–3 hours',
          '3–6 hours',
          '6 or more hours',
        ],
      },
      {
        field: 'weather_conditions',
        label: 'What are the expected weather conditions?',
        type: 'single',
        options: [
          'Cold (under 60°F / 15°C)',
          'Cool to moderate (60–75°F / 15–24°C)',
          'Hot (75–85°F / 24–29°C)',
          'Hot and humid (85°F+ / 29°C+)',
          'Not sure yet',
        ],
      },
    ],
  },
  {
    title: 'Your Body',
    subtitle: 'Understanding your physiology helps us match products to how your body actually responds.',
    questions: [
      {
        field: 'cramping_tendency',
        label: 'Do you cramp or see heavy salt deposits on your skin after long efforts?',
        type: 'single',
        options: [
          'Yes — I cramp regularly, sodium depletion is a real problem',
          'I sweat heavily and see salt deposits after workouts',
          'Neither — standard hydration works fine for me',
          'Not sure yet',
        ],
      },
      {
        field: 'gi_distress',
        label: 'Have you experienced GI distress during racing or hard training?',
        type: 'single',
        options: [
          'Yes — it\'s a significant problem for me',
          'Occasionally — in certain conditions or with certain products',
          'Rarely — only in extreme heat or on very long efforts',
          'Never — I have an iron stomach',
        ],
      },
      {
        field: 'flavor_fatigue',
        label: 'Does sweet flavor become hard to stomach on long efforts?',
        type: 'single',
        showIf: (a: Answers) => a['race_duration'] !== 'Under 1 hour',
        options: [
          'Yes — sweet gels become unbearable after a few hours',
          'Sometimes — only on very long efforts (4+ hours)',
          'No — I can eat the same thing all day without issue',
          'Not sure — I haven\'t raced long enough to find out',
        ],
      },
    ],
  },
  {
    title: 'Preferences',
    subtitle: 'Your product preferences shape both what we recommend and how to use it.',
    questions: [
      {
        field: 'format_preference',
        label: 'What nutrition formats work for you? Select all that apply.',
        type: 'multi',
        options: [
          'Gels',
          'Chews or gummies',
          'Bars',
          'Liquid drink mix',
          'No preference / not sure',
        ],
      },
      {
        field: 'texture_preference',
        label: 'What gel textures work for you? Select all that apply.',
        type: 'multi',
        options: [
          'Thin/watery — no water needed, goes down like a drink',
          'Standard gel — smooth and pourable, best taken with water',
          'Semi-solid / gel cube — can be taken with or without water',
          'No preference / not sure',
        ],
      },
      {
        field: 'caffeine_strategy',
        label: 'How do you use caffeine during racing?',
        type: 'single',
        options: [
          'Strategic late-race use — last 45–60 minutes only',
          'Throughout the race',
          'Not sure',
          'I avoid caffeine entirely',
        ],
      },
      {
        field: 'dietary_restrictions',
        label: 'Any dietary restrictions or preferences?',
        type: 'multi',
        options: [
          'Vegan or plant-based',
          'Gluten free',
          'No artificial sweeteners',
          'None',
        ],
      },
      {
        field: 'problematic_products',
        label: 'Have any products or ingredients caused problems for you?',
        type: 'text',
        placeholder: 'e.g. GU gels, maltodextrin, caffeine — anything that didn\'t agree with you',
        optional: true,
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
  nutrition: NUTRITION_STEPS,
  'running-shoes': RUNNING_SHOES_STEPS,
  // Add new categories here as they launch. Each category needs:
  //   1. A StepDef[] constant above
  //   2. An entry in CATEGORY_BUDGET_LABELS
  //   3. An entry in CATEGORY_BUDGET_DEFAULTS
  //   4. An entry in CATEGORY_SHOW_BUDGET (false if budget widget should be hidden)
  // No other changes required — the guard and rendering handle the rest.
}

const CATEGORY_BUDGET_LABELS: Record<string, string> = {
  wetsuits: 'What is your budget for this wetsuit?',
  'gps-watches': 'What is your budget for a GPS watch?',
  'nutrition': 'What is your budget for nutrition products?',
  'running-shoes': 'What is your budget for running shoes?',
}

const CATEGORY_BUDGET_DEFAULTS: Record<string, { min: number; max: number }> = {
  wetsuits: { min: 200, max: 600 },
  'gps-watches': { min: 0, max: 800 },
  'nutrition': { min: 0, max: 100 },
  'running-shoes': { min: 120, max: 200 },
}

const CATEGORY_SHOW_BUDGET: Record<string, boolean> = {
  wetsuits: true,
  'gps-watches': true,
  nutrition: false,
  'running-shoes': true,
}

const MULTI_EXCLUSIVE_SENTINELS: Record<string, string> = {
  format_preference: 'No preference / not sure',
  texture_preference: 'No preference / not sure',
  dietary_restrictions: 'None',
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
  const [minText, setMinText] = useState(String(valueMin))
  const [maxText, setMaxText] = useState(String(valueMax))

  function commitMin(raw: string) {
    const v = parseInt(raw.replace(/\D/g, ''), 10)
    const clamped = isNaN(v) ? 0 : v
    onChangeMin(clamped)
    setMinText(String(clamped))
  }

  const maxInputRef = useRef<HTMLInputElement>(null)

  // Switch from "No limit" into numeric entry: start EMPTY (never a stale
  // default the user didn't choose) and focus so they type their own ceiling.
  function enterMaxEntry() {
    onToggleNoLimit(false)
    setMaxText('')
    requestAnimationFrame(() => maxInputRef.current?.focus())
  }

  function commitMax(raw: string) {
    const digits = raw.replace(/\D/g, '')
    const v = parseInt(digits, 10)
    // Left blank — treat as "no upper limit" rather than snapping to a default.
    if (digits === '' || isNaN(v) || v === 0) {
      onToggleNoLimit(true)
      return
    }
    const clamped = Math.max(v, valueMin + 1)
    onChangeMax(clamped)
    setMaxText(String(clamped))
  }

  const inputBase = 'w-full bg-[#0A1628] border border-[#1A3A5C] text-white font-mono font-semibold text-lg rounded-md py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all text-center'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Min */}
        <div className="flex-1">
          <p className="text-[#6B7280] text-xs mb-1.5 text-center">Min</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-mono text-sm pointer-events-none">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={minText}
              onChange={(e) => setMinText(e.target.value.replace(/\D/g, ''))}
              onBlur={(e) => commitMin(e.target.value)}
              className={`${inputBase} pl-7 pr-3`}
            />
          </div>
        </div>

        <p className="text-[#6B7280] text-sm mt-5 shrink-0">to</p>

        {/* Max — either editable number or tappable "No limit" */}
        <div className="flex-1">
          <p className="text-[#6B7280] text-xs mb-1.5 text-center">Max</p>
          {noLimit ? (
            <button
              type="button"
              onClick={enterMaxEntry}
              className="w-full bg-[#0A1628] border border-[#22C55E] text-[#22C55E] font-semibold text-base rounded-md py-3 px-3 flex items-center justify-center gap-1.5 transition-all hover:bg-[#22C55E10]"
            >
              <span className="text-lg leading-none">∞</span>
              <span>No limit</span>
            </button>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-mono text-sm pointer-events-none">$</span>
              <input
                ref={maxInputRef}
                type="text"
                inputMode="numeric"
                value={maxText}
                placeholder={String(valueMax)}
                onChange={(e) => setMaxText(e.target.value.replace(/\D/g, ''))}
                onBlur={(e) => commitMax(e.target.value)}
                className={`${inputBase} pl-7 pr-3 placeholder:text-[#6B7280] placeholder:font-normal`}
              />
            </div>
          )}
        </div>
      </div>

      {/* No limit toggle — only shown when max is a number */}
      {!noLimit && (
        <button
          type="button"
          onClick={() => onToggleNoLimit(true)}
          className="w-full text-[#6B7280] hover:text-white text-sm transition-colors py-2 flex items-center justify-center gap-1.5 rounded-md hover:bg-[#1A3A5C20]"
        >
          <span className="text-base leading-none">∞</span>
          No upper limit
        </button>
      )}
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

  // Track which Layer 1 fields were prefilled from athlete_profiles.
  // Used to detect user overrides and trigger a profile write-back on submit.
  const [layer1PrefillOrigin, setLayer1PrefillOrigin] = useState<Record<string, string>>({})

  const { profile } = useAthleteProfile()

  const sportToFuelingFor: Record<string, string> = {
    triathlon: 'Triathlon',
    running: 'Running',
    cycling: 'Cycling',
    swimming: 'Swimming',
  }
  const skipFuelingForQuestion =
    category === 'nutrition' &&
    !!profile &&
    (profile.sports?.length ?? 0) === 1 &&
    profile.current_focus_sport !== 'triathlon'

  const userSports = profile?.sports ?? []
  const hasTriathlon = userSports.includes('triathlon')
  const hasCycling = userSports.includes('cycling')

  function shouldSkipQuestion(field: string): boolean {
    if (!profile) return false
    if (skipFuelingForQuestion && field === 'fueling_for') return true
    if (field === 'triathlon_mode' && !hasTriathlon) return true
    if ((field === 'power_meter' || field === 'multi_bike_setup') && !hasTriathlon && !hasCycling) return true
    return false
  }

  // Prefill fueling_for for nutrition when single-sport athlete
  useEffect(() => {
    if (skipFuelingForQuestion && profile?.current_focus_sport && !answers.fueling_for) {
      const value = sportToFuelingFor[profile.current_focus_sport]
      if (value) setAnswers((prev) => ({ ...prev, fueling_for: value }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipFuelingForQuestion, profile?.current_focus_sport])

  // Prefill foot_width and arch_type from athlete_profiles for running-shoes.
  // We record the original profile value so we can detect overrides on submit.
  useEffect(() => {
    if (category !== 'running-shoes' || !profile) return
    setAnswers((prev) => {
      const next = { ...prev }
      const origins: Record<string, string> = {}
      if (profile.foot_width && !prev.foot_width) {
        next.foot_width = profile.foot_width
        origins.foot_width = profile.foot_width
      }
      if (profile.arch_type && !prev.arch_type) {
        next.arch_type = profile.arch_type
        origins.arch_type = profile.arch_type
      }
      if (Object.keys(origins).length > 0) {
        setLayer1PrefillOrigin((o) => ({ ...o, ...origins }))
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.foot_width, profile?.arch_type, category])

  const steps = CATEGORY_STEPS[category]

  // Filter out steps whose stepShowIf returns false. Inner question-level
  // `showIf` is still applied at render time inside the step. This is the
  // step-level version: hides the whole step (title + nav slot included).
  const visibleSteps = steps
    ? steps.filter((s) => !s.stepShowIf || s.stepShowIf(answers))
    : []

  // Clamp step index when visibleSteps shrinks (e.g. user goes back to
  // step 1 and changes an answer that hides a later step). Without this
  // clamp, step could point past the end of visibleSteps and crash.
  useEffect(() => {
    if (visibleSteps.length > 0 && step > visibleSteps.length - 1) {
      setStep(visibleSteps.length - 1)
    }
  }, [visibleSteps.length, step])

  // Reset scroll to top when the user advances/retreats steps. Without
  // this, the browser preserves scroll position from the previous step —
  // which puts the user at the bottom of the new step (where the Next
  // button was) instead of the top (where the new questions are).
  // Use 'auto' (instant) — smooth scrolling between steps feels janky.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [step])

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

  const totalSteps = visibleSteps.length
  const currentGroup = visibleSteps[step]
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
      const sentinel = MULTI_EXCLUSIVE_SENTINELS[field]
      let updated: string[]

      // Look up maxSelect for this field from the StepDef (caps the number of
      // simultaneous selections — see QuestionDef.maxSelect).
      const fieldDef = steps.flatMap((s) => s.questions).find((q) => q.field === field)
      const maxSelect = fieldDef?.maxSelect

      if (sentinel && value === sentinel) {
        // Selecting the sentinel clears everything else
        updated = current.includes(sentinel) ? [] : [sentinel]
      } else if (sentinel && current.includes(sentinel)) {
        // Selecting a real option when sentinel is active: remove sentinel, add option
        updated = [value]
      } else {
        const alreadySelected = current.includes(value)
        if (alreadySelected) {
          updated = current.filter((v) => v !== value)
        } else if (maxSelect !== undefined && current.length >= maxSelect) {
          // Cap reached — block the add. Deselect-to-make-room is on the user.
          updated = current
        } else {
          updated = [...current, value]
        }
      }

      const next = { ...prev, [field]: updated }
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
      if (shouldSkipQuestion(q.field)) continue
      if (q.optional) continue
      if (q.type === 'text') continue
      if (q.type === 'brand_sentiment') continue
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
      const showBudget = CATEGORY_SHOW_BUDGET[category] !== false
      sessionStorage.setItem(
        'trikit_budget',
        JSON.stringify({
          min: showBudget ? budgetMin : 0,
          max: showBudget ? (budgetNoLimit ? 999999 : budgetMax) : 999999,
        })
      )

      // Write back changed Layer 1 prefill fields to athlete_profiles.
      // Fired fire-and-forget — we don't block navigation on this.
      if (category === 'running-shoes' && Object.keys(layer1PrefillOrigin).length > 0) {
        const profileUpdates: Record<string, string> = {}
        for (const field of ['foot_width', 'arch_type'] as const) {
          const origin = layer1PrefillOrigin[field]
          const current = answers[field] as string | undefined
          if (current && current !== origin) {
            profileUpdates[field] = current
          } else if (current && !origin) {
            // Field was never in profile — save it now
            profileUpdates[field] = current
          }
        }
        if (Object.keys(profileUpdates).length > 0) {
          fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileUpdates),
          }).catch(() => {
            // Non-blocking — profile update failure doesn't stop the recommendation
          })
        }
      }

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
      <Link
        href={`/gear/${category}`}
        className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-6"
      >
        <span>←</span> Back to {category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
      </Link>
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
          if (shouldSkipQuestion(q.field)) return null
          // Filter longest_event options to the user's selected sports
          let options = q.options ?? []
          if (q.field === 'longest_event' && profile?.sports && profile.sports.length > 0) {
            const sportPrefixMap: Record<string, string> = { triathlon: 'tri', running: 'run', cycling: 'bike', swimming: 'swim' }
            const allowedPrefixes = profile.sports.map((s) => sportPrefixMap[s]).filter(Boolean)
            options = options.filter((opt) => {
              const key = Object.entries(DISTANCE_LABELS).find(([, label]) => label === opt)?.[0]
              if (!key) return true
              return allowedPrefixes.some((p) => key.startsWith(`${p}:`))
            })
          }
          const isLayer1Prefilled =
            category === 'running-shoes' &&
            (q.field === 'foot_width' || q.field === 'arch_type') &&
            !!layer1PrefillOrigin[q.field]

          return (
            <div key={q.field}>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-white font-medium text-sm leading-snug">{q.label}</p>
                {q.optional && (
                  <span className="text-[#6B7280] text-xs font-normal flex-shrink-0">(optional)</span>
                )}
                {q.type === 'multi' && q.maxSelect !== undefined && (
                  <span className="text-[#6B7280] text-xs font-normal flex-shrink-0">
                    (select up to {q.maxSelect})
                  </span>
                )}
                {isLayer1Prefilled && (
                  <span className="text-[#6B7280] text-xs font-normal flex-shrink-0 underline-offset-2 hover:underline cursor-default">
                    From your profile
                  </span>
                )}
              </div>
              {q.type === 'text' ? (
                <TextInput
                  field={q.field}
                  placeholder={q.placeholder ?? ''}
                  answers={answers}
                  onChange={handleSingleChange}
                />
              ) : q.type === 'brand_sentiment' ? (
                <BrandSentimentPicker
                  brands={q.options ?? []}
                  preferredField={q.field}
                  avoidedField={q.secondaryField ?? ''}
                  answers={answers}
                  onChange={(preferredField, avoidedField, preferred, avoided) => {
                    setAnswers(prev => ({ ...prev, [preferredField]: preferred, [avoidedField]: avoided }))
                  }}
                />
              ) : q.type === 'multi' ? (
                <MultiSelect
                  field={q.field}
                  options={options}
                  optionGroups={q.optionGroups}
                  answers={answers}
                  onChange={handleMultiChange}
                />
              ) : (
                <SingleSelect
                  field={q.field}
                  options={options}
                  answers={answers}
                  onChange={handleSingleChange}
                />
              )}
            </div>
          )
        })}

        {/* Budget input — last step only, hidden for categories where budget is not relevant */}
        {isLastStep && (CATEGORY_SHOW_BUDGET[category] !== false) && (
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
