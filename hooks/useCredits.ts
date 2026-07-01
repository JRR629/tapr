'use client'

import { useState, useEffect, useCallback } from 'react'
import { CREDITS_CHANGED_EVENT } from '@/lib/creditsEvents'

interface UseCreditsResult {
  credits: number | null
  isLoading: boolean
  refresh: () => void
}

export function useCredits(): UseCreditsResult {
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // `silent` refreshes (event/focus-driven) don't toggle the loading state, so
  // the balance never flickers to a placeholder when it updates live.
  const fetchCredits = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await fetch('/api/credits', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json() as { credits: number }
      setCredits(data.credits)
    } catch {
      // Keep the previous value on a transient error rather than blanking it.
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [])

  // Initial load.
  useEffect(() => {
    void fetchCredits()
  }, [fetchCredits])

  // Live refresh: when any action changes credits (fires CREDITS_CHANGED_EVENT)
  // or the tab regains focus, re-fetch silently so every display stays in sync.
  useEffect(() => {
    const handler = () => void fetchCredits(true)
    window.addEventListener(CREDITS_CHANGED_EVENT, handler)
    window.addEventListener('focus', handler)
    return () => {
      window.removeEventListener(CREDITS_CHANGED_EVENT, handler)
      window.removeEventListener('focus', handler)
    }
  }, [fetchCredits])

  return { credits, isLoading, refresh: fetchCredits }
}
