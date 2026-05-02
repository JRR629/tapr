'use client'

import { useState } from 'react'
import { Waves, Watch, Eye, Shirt, Footprints, Zap, Bike, Package, CheckCircle, Bell } from 'lucide-react'

interface ComingSoonCardProps {
  categoryName: string
  categorySlug: string
  description: string | null
}

const ICON_MAP: Record<string, React.ReactNode> = {
  wetsuits: <Waves size={40} />,
  'gps-watches': <Watch size={40} />,
  goggles: <Eye size={40} />,
  'tri-suits': <Shirt size={40} />,
  'running-shoes': <Footprints size={40} />,
  nutrition: <Zap size={40} />,
  bikes: <Bike size={40} />,
  accessories: <Package size={40} />,
}

type SubmitState = 'idle' | 'loading' | 'success' | 'already_signed_up' | 'error'

export function ComingSoonCard({ categoryName, categorySlug, description }: ComingSoonCardProps) {
  const [email, setEmail] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  const icon = ICON_MAP[categorySlug] ?? <Bell size={40} />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitState('loading')

    try {
      const res = await fetch('/api/category-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, categorySlug }),
      })

      if (res.ok) {
        setSubmitState('success')
        return
      }

      const body = await res.json() as { code?: string }
      if (body.code === 'ALREADY_SIGNED_UP') {
        setSubmitState('already_signed_up')
      } else {
        setSubmitState('error')
      }
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8 max-w-md w-full mx-auto text-center">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FF6B3520] text-[#FF6B35] mb-6">
        {icon}
      </div>

      {/* Category name */}
      <h2 className="font-display text-5xl text-white mb-1">
        {categoryName.toUpperCase()}
      </h2>

      {/* Coming soon badge */}
      <span className="inline-block bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
        Coming Soon
      </span>

      {/* Description */}
      {description && (
        <p className="text-[#D1D5DB] text-sm leading-relaxed mb-6">{description}</p>
      )}

      {/* Email capture / feedback states */}
      {submitState === 'success' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle size={32} className="text-[#22C55E]" />
          <p className="text-[#22C55E] font-semibold">You&apos;re on the list!</p>
          <p className="text-[#6B7280] text-sm">
            We&apos;ll email you as soon as {categoryName} launches.
          </p>
        </div>
      )}

      {submitState === 'already_signed_up' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle size={32} className="text-[#FF6B35]" />
          <p className="text-[#FF6B35] font-semibold">Already signed up!</p>
          <p className="text-[#6B7280] text-sm">
            You&apos;ll be notified when {categoryName} launches.
          </p>
        </div>
      )}

      {submitState === 'error' && (
        <div className="mb-4">
          <p className="text-[#EF4444] text-sm">
            Something went wrong. Please try again.
          </p>
        </div>
      )}

      {(submitState === 'idle' || submitState === 'error' || submitState === 'loading') && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-[#6B7280] text-sm mb-1">
            Get notified when this category launches:
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={submitState === 'loading'}
            className="bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] min-h-[44px] disabled:opacity-50 transition-shadow"
          />
          <button
            type="submit"
            disabled={submitState === 'loading'}
            className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitState === 'loading' ? 'Signing you up...' : `Notify Me When ${categoryName} Launches`}
          </button>
        </form>
      )}
    </div>
  )
}
