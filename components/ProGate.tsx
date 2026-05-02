'use client'

import { Lock } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { useState } from 'react'

interface ProGateProps {
  children?: React.ReactNode
  feature?: string
}

export function ProGate({ children, feature }: ProGateProps) {
  const { isPro, isLoading } = useSubscription()
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  if (isLoading) return null

  if (isPro) return <>{children}</>

  async function handleUpgrade() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FF6B3520] flex items-center justify-center">
          <Lock className="w-5 h-5 text-[#FF6B35]" />
        </div>

        <span className="bg-[#FF6B3520] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
          Pro Feature
        </span>

        <p className="text-[#D1D5DB] text-sm leading-relaxed max-w-sm">
          {feature
            ? `${feature} is available on the Pro plan.`
            : 'This feature is available on the Pro plan.'}{' '}
          Upgrade to unlock side-by-side comparisons, unlimited recommendations, and deep analysis.
        </p>

        <button
          onClick={handleUpgrade}
          disabled={checkoutLoading}
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] inline-flex items-center"
        >
          {checkoutLoading ? 'Loading…' : 'Upgrade to Pro — $12/month'}
        </button>
      </div>
    </div>
  )
}
