'use client'

import { useState, useEffect } from 'react'
import type { AthleteProfile } from '@/types/profile'

export function useAthleteProfile() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        const data = await response.json() as { data: AthleteProfile }
        setProfile(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  return { profile, isLoading, error }
}
