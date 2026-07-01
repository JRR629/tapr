// Lightweight cross-component signal so every credit display (header balance,
// billing page, gates) refreshes the moment credits change — without a shared
// store. Fire notifyCreditsChanged() after any action that deducts, refunds, or
// grants credits; useCredits listens for it and re-fetches silently.
export const CREDITS_CHANGED_EVENT = 'credits:changed'

export function notifyCreditsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT))
  }
}
