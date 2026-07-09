import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Format a USD price for display. Whole-dollar prices stay clean ("385"),
// prices with cents always show two decimals ("5.50", not "5.5"). Returns the
// number only — prepend "$" at the call site. `.toLocaleString()` alone drops
// trailing zeros, which is the bug this fixes.
export function formatPrice(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Number.isInteger(n)
    ? n.toLocaleString('en-US')
    : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
