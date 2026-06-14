'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseCreditsResult {
  credits: number | null
  isLoading: boolean
  refresh: () => void
}

export function useCredits(): UseCreditsResult {
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCredits = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/credits')
      if (!res.ok) {
        setCredits(null)
        return
      }
      const data = await res.json() as { credits: number }
      setCredits(data.credits)
    } catch {
      setCredits(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCredits()
  }, [fetchCredits])

  return { credits, isLoading, refresh: fetchCredits }
}
