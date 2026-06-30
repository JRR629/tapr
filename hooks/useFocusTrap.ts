'use client'

import { useEffect, useRef } from 'react'

// Accessibility (item 15). When `active`, traps keyboard focus inside the
// returned ref'd element: moves focus in on open, cycles Tab/Shift+Tab within,
// and restores focus to the previously-focused element (the trigger) on close.
// Pair with `role="dialog" aria-modal="true"` on the same element and give it
// `tabIndex={-1}` so it can receive focus when it has no focusable children.
//
// Escape-to-close is intentionally NOT handled here — callers own that so the
// close animation/state stays with the component.
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const visibleFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      )

    // Move focus into the dialog (first focusable, else the container itself).
    const first = visibleFocusable()[0]
    ;(first ?? node).focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = visibleFocusable()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      // Restore focus to the trigger so keyboard users aren't dropped at the top.
      previouslyFocused?.focus?.()
    }
  }, [active])

  return ref
}
