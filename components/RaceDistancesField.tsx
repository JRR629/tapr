'use client'

import { SPORT_LABELS, SPORT_PREFIX, RACE_DISTANCES_BY_SPORT, DISTANCE_LABELS, type Sport } from '@/lib/sports'

interface RaceDistancesFieldProps {
  sports: Sport[]
  selectedDistances: string[]
  currentFocus: string | null
  onDistancesChange: (next: string[]) => void
  onCurrentFocusChange: (next: string | null) => void
}

export function RaceDistancesField({ sports, selectedDistances, currentFocus, onDistancesChange, onCurrentFocusChange }: RaceDistancesFieldProps) {
  function toggleDistance(key: string) {
    const next = selectedDistances.includes(key)
      ? selectedDistances.filter((d) => d !== key)
      : [...selectedDistances, key]
    onDistancesChange(next)
    if (currentFocus === key && !next.includes(key)) {
      onCurrentFocusChange(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {sports.map((sport) => {
        const sportDistances = RACE_DISTANCES_BY_SPORT[sport]
        const prefix = SPORT_PREFIX[sport]
        return (
          <div key={sport}>
            {sports.length > 1 && (
              <p className="text-[#6B7280] text-xs uppercase tracking-widest font-semibold mb-3">{SPORT_LABELS[sport]}</p>
            )}
            <div className="flex flex-col gap-2">
              {sportDistances.map((distance) => {
                const key = `${prefix}:${distance}`
                const isChecked = selectedDistances.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDistance(key)}
                    className={`text-left px-4 py-3 rounded-md border transition-all min-h-[44px] ${
                      isChecked
                        ? 'border-[#FF6B35] bg-[#FF6B3510] text-white'
                        : 'border-[#1A3A5C] text-[#D1D5DB] hover:border-[#FF6B35]'
                    }`}
                  >
                    <span className="text-sm">{DISTANCE_LABELS[key] ?? key}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {selectedDistances.length > 0 && (
        <div className="border-t border-[#1A3A5C] pt-5">
          <p className="text-[#D1D5DB] text-sm font-semibold mb-3">Currently training for…</p>
          <p className="text-[#6B7280] text-xs mb-4">Optional — pick one if you have a specific race in mind right now.</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onCurrentFocusChange(null)}
              className={`text-left px-4 py-3 rounded-md border transition-all min-h-[44px] ${
                currentFocus === null
                  ? 'border-[#FF6B35] bg-[#FF6B3510] text-white'
                  : 'border-[#1A3A5C] text-[#D1D5DB] hover:border-[#FF6B35]'
              }`}
            >
              <span className="text-sm">Not training for a specific event right now</span>
            </button>
            {selectedDistances.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onCurrentFocusChange(key)}
                className={`text-left px-4 py-3 rounded-md border transition-all min-h-[44px] ${
                  currentFocus === key
                    ? 'border-[#FF6B35] bg-[#FF6B3510] text-white'
                    : 'border-[#1A3A5C] text-[#D1D5DB] hover:border-[#FF6B35]'
                }`}
              >
                <span className="text-sm">{DISTANCE_LABELS[key] ?? key}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
