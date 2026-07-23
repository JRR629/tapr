// Mirrors the Supabase Auth password policy exactly (Dashboard → Authentication
// → Password requirements = "Lowercase, uppercase letters, digits and symbols",
// minimum length 8). This is the single client-side source of truth for password
// rules — if it drifts from the dashboard setting, Supabase rejects users with a
// raw, confusing character-set dump instead of our friendly checklist.

export interface PasswordRule {
  id: string
  label: string
  test: (pw: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'lower', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { id: 'symbol', label: 'One symbol (e.g. ! ? @ #)', test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
]

export function getUnmetRules(pw: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(pw))
}

export function isPasswordValid(pw: string): boolean {
  return getUnmetRules(pw).length === 0
}

// Friendly one-line error naming exactly what's still missing, e.g.
// "Your password still needs: an uppercase letter and a symbol."
export function friendlyPasswordError(pw: string): string | null {
  const unmet = getUnmetRules(pw)
  if (unmet.length === 0) return null

  const phrases: Record<string, string> = {
    length: 'at least 8 characters',
    lower: 'a lowercase letter',
    upper: 'an uppercase letter',
    number: 'a number',
    symbol: 'a symbol',
  }
  const items = unmet.map((r) => phrases[r.id])
  const list =
    items.length === 1
      ? items[0]
      : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
  return `Your password still needs: ${list}.`
}

// Any auth error whose message mentions "password" is re-expressed against our
// own rules so Supabase's raw character-set dump never reaches a user. Non-
// password errors (e.g. "User already registered") pass through unchanged.
export function humanizeAuthError(rawMessage: string, pw: string): string {
  if (/password/i.test(rawMessage)) {
    return friendlyPasswordError(pw) ?? 'That password can\'t be used. Please choose a different one.'
  }
  return rawMessage
}
