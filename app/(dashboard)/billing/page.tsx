'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { useState } from 'react'
import { CheckCircle, XCircle, Crown, CreditCard, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function BillingPage() {
  const { subscription, isLoading, isPro } = useSubscription()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  async function handleUpgrade() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="flex-1 p-8 max-w-2xl">
      <h1 className="font-display text-5xl text-white mb-2">BILLING</h1>
      <p className="text-[#6B7280] mb-8">Manage your Tapr subscription.</p>

      {success && (
        <div className="flex items-center gap-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg px-4 py-3 mb-6">
          <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
          <p className="text-[#22C55E] text-sm font-medium">You&apos;re now on Pro. Welcome to the full Tapr experience.</p>
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3 mb-6">
          <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
          <p className="text-[#EF4444] text-sm font-medium">Checkout canceled — you haven&apos;t been charged.</p>
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPro ? (
              <Crown className="w-5 h-5 text-[#FF6B35]" />
            ) : (
              <Zap className="w-5 h-5 text-[#6B7280]" />
            )}
            <span className="text-white font-semibold text-lg">
              {isLoading ? '—' : isPro ? 'Pro Plan' : 'Free Plan'}
            </span>
          </div>
          {isPro && (
            <span className="bg-[#FF6B3520] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
              Active
            </span>
          )}
        </div>

        {isPro && periodEnd && (
          <p className="text-[#6B7280] text-sm mb-4">
            Next billing date: <span className="text-[#D1D5DB]">{periodEnd}</span>
          </p>
        )}

        {!isLoading && isPro ? (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 border border-[#1A3A5C] hover:border-[#FF6B35] text-white font-semibold px-5 py-2.5 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            <CreditCard className="w-4 h-4" />
            {portalLoading ? 'Loading…' : 'Manage Billing'}
          </button>
        ) : !isLoading ? (
          <button
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {checkoutLoading ? 'Loading…' : 'Upgrade to Pro — $12/month'}
          </button>
        ) : null}
      </div>

      {/* Feature comparison */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
        <h2 className="font-display text-2xl text-white mb-4">WHAT YOU GET</h2>
        <div className="space-y-3">
          {[
            { feature: 'All active gear categories', free: true, pro: true },
            { feature: 'Personalized AI recommendations', free: true, pro: true },
            { feature: 'Recommendations per day', free: '3', pro: 'Unlimited' },
            { feature: 'Recommendation history', free: 'Last 3', pro: 'Full history' },
            { feature: 'Side-by-side product comparison', free: false, pro: true },
            { feature: 'Deep analysis mode', free: false, pro: true },
          ].map(({ feature, free, pro }) => (
            <div key={feature} className="grid grid-cols-3 items-center gap-4 py-2 border-b border-[#1A3A5C] last:border-0">
              <span className="col-span-1 text-[#D1D5DB] text-sm">{feature}</span>
              <span className="text-center text-sm">
                {free === true ? <CheckCircle className="w-4 h-4 text-[#22C55E] mx-auto" /> :
                 free === false ? <span className="text-[#6B7280]">—</span> :
                 <span className="text-[#6B7280]">{free}</span>}
              </span>
              <span className="text-center text-sm">
                {pro === true ? <CheckCircle className="w-4 h-4 text-[#FF6B35] mx-auto" /> :
                 pro === false ? <span className="text-[#6B7280]">—</span> :
                 <span className="text-[#FF6B35] font-semibold">{pro}</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 mt-3">
          <span />
          <span className="text-center text-xs text-[#6B7280] font-medium uppercase tracking-wide">Free</span>
          <span className="text-center text-xs text-[#FF6B35] font-medium uppercase tracking-wide">Pro</span>
        </div>
      </div>

      <p className="text-[#6B7280] text-xs mt-6">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </p>
    </div>
  )
}
