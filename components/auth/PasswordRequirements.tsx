'use client'

import { PASSWORD_RULES } from '@/lib/validation/password'

// Live checklist shown beneath a password field. Each rule flips from a muted
// dot to a green check as the user types, so requirements are visible BEFORE
// submitting. Renders only once the user has started typing, to avoid clutter.
export function PasswordRequirements({ password }: { password: string }) {
  if (password.length === 0) return null

  return (
    <ul className="mt-2.5 space-y-1.5" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password)
        return (
          <li key={rule.id} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center transition-colors ${met ? 'text-[#22C55E]' : 'text-[#6B7280]'}`}
              aria-hidden="true"
            >
              {met ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                  <circle cx="3" cy="3" r="3" />
                </svg>
              )}
            </span>
            <span className={met ? 'text-[#D1D5DB] transition-colors' : 'text-[#6B7280] transition-colors'}>
              {rule.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
