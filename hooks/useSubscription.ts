'use client'

import { useState, useEffect } from 'react'

interface Subscription {
  plan: 'free' | 'pro'
  status: string
  current_period_end: string | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscription')
      .then((r) => r.json())
      .then((data: { data: Subscription }) => {
        setSubscription(data.data)
      })
      .catch(() => {
        setSubscription({ plan: 'free', status: 'active', current_period_end: null })
      })
      .finally(() => setIsLoading(false))
  }, [])

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active'

  return { subscription, isLoading, isPro }
}
