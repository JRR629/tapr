'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Zap, Loader2, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { track } from '@vercel/analytics'
import { useCredits } from '@/hooks/useCredits'
import { notifyCreditsChanged } from '@/lib/creditsEvents'

const CREDIT_PACKS = [
  {
    id: '3' as const,
    credits: 3,
    price: '$2.99',
    label: '3 Credits',
    description: 'Try a new category',
    popular: false,
  },
  {
    id: '10' as const,
    credits: 10,
    price: '$8.99',
    label: '10 Credits',
    description: 'Best for a full kit',
    popular: true,
  },
  {
    id: '25' as const,
    credits: 25,
    price: '$17.99',
    label: '25 Credits',
    description: 'Serious gear planning',
    popular: false,
  },
]

const PACK_CREDIT_MAP: Record<string, number> = { '3': 3, '10': 10, '25': 25 }

export default function BillingPage() {
  const { credits, isLoading } = useCredits()
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'
  const successPack = searchParams.get('pack')
  const sessionId = searchParams.get('session_id')
  const creditsAdded = successPack ? PACK_CREDIT_MAP[successPack] : null

  // Verification of a returning purchase. We do NOT trust ?success=true alone —
  // that's only the redirect. We poll for the credit_transactions row the webhook
  // writes (keyed by the Stripe session id) and claim success once it exists.
  const [verifyState, setVerifyState] = useState<'idle' | 'pending' | 'confirmed' | 'timeout'>('idle')
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null)

  // Fire the purchase conversion event when Stripe returns success. Keyed on the
  // pack so a re-render doesn't re-fire; a manual refresh of the success URL can
  // still double-count (acceptable for launch analytics).
  useEffect(() => {
    if (success && successPack) {
      track('credit_purchase', { pack: successPack, credits: creditsAdded ?? 0 })
    }
  }, [success, successPack, creditsAdded])

  // Confirm the credits actually landed before telling the user they did.
  useEffect(() => {
    if (!success) return
    // No session id to verify against (e.g. an old link) — show a neutral
    // "processing" state instead of a false success claim.
    if (!sessionId) {
      setVerifyState('timeout')
      return
    }

    let cancelled = false
    let attempts = 0
    setVerifyState('pending')

    const poll = async () => {
      attempts += 1
      try {
        const res = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = (await res.json()) as { confirmed: boolean; amount?: number }
          if (data.confirmed) {
            if (cancelled) return
            setConfirmedAmount(data.amount ?? null)
            setVerifyState('confirmed')
            notifyCreditsChanged() // live-refresh the balance everywhere
            return
          }
        }
      } catch {
        // transient — will retry
      }
      if (cancelled) return
      if (attempts >= 10) {
        setVerifyState('timeout')
        return
      }
      setTimeout(() => void poll(), 1500)
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [success, sessionId])

  async function handleBuy(pack: '3' | '10' | '25') {
    setLoadingPack(pack)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
    } finally {
      setLoadingPack(null)
    }
  }

  return (
    <div className="flex-1 p-8 max-w-3xl">
      <h1 className="font-display text-5xl text-white mb-2">BILLING</h1>
      <p className="text-[#6B7280] mb-8">Purchase credit packs to get gear recommendations.</p>

      {success && verifyState === 'pending' && (
        <div className="flex items-center gap-3 bg-[#0F2040] border border-[#1A3A5C] rounded-lg px-4 py-3 mb-6">
          <Loader2 className="w-5 h-5 text-[#FF6B35] shrink-0 animate-spin" />
          <p className="text-[#D1D5DB] text-sm font-medium">Payment received — confirming your credits…</p>
        </div>
      )}

      {success && verifyState === 'confirmed' && (
        <div className="flex items-center gap-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg px-4 py-3 mb-6">
          <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
          <p className="text-[#22C55E] text-sm font-medium">
            {confirmedAmount
              ? `${confirmedAmount} credits added to your account.`
              : 'Credits added to your account.'}
          </p>
        </div>
      )}

      {success && verifyState === 'timeout' && (
        <div className="flex items-center gap-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0" />
          <p className="text-[#F59E0B] text-sm font-medium">
            Payment received. Your credits are being processed and will appear shortly — refresh this page in a moment if you don&apos;t see them.
          </p>
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3 mb-6">
          <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
          <p className="text-[#EF4444] text-sm font-medium">Checkout canceled — you haven&apos;t been charged.</p>
        </div>
      )}

      {/* Credit balance card */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-[#FF6B35]" />
          <span className="text-[#6B7280] text-sm font-medium uppercase tracking-wide">Credits Remaining</span>
        </div>
        <p className="font-display text-6xl text-white mb-1">
          {isLoading ? '—' : credits}
        </p>
        <p className="text-[#6B7280] text-sm">Credits never expire.</p>
      </div>

      <p className="text-[#D1D5DB] text-sm mb-6">
        All accounts start with 3 free credits — enough to try every launch category.
      </p>

      {/* Credit pack cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className="bg-[#0F2040] rounded-lg p-6 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 border border-[#1A3A5C]"
          >
            {pack.popular && (
              <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide self-start">
                Most Popular
              </span>
            )}
            <div>
              <p className="font-display text-3xl text-white">{pack.credits} CREDITS</p>
              <p className="text-[#6B7280] text-sm mt-1">{pack.description}</p>
            </div>
            <p className="text-[#FF6B35] text-2xl font-semibold">{pack.price}</p>
            <button
              onClick={() => void handleBuy(pack.id)}
              disabled={loadingPack !== null}
              className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] mt-auto"
            >
              {loadingPack === pack.id ? 'Loading…' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      {checkoutError && (
        <p className="text-[#EF4444] text-sm mb-6">{checkoutError}</p>
      )}

      <p className="text-[#6B7280] text-xs">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </p>
    </div>
  )
}
