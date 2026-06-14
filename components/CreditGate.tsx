'use client'

import Link from 'next/link'
import { useCredits } from '@/hooks/useCredits'

interface CreditGateProps {
  cost: 1 | 2
  onProceed: () => void
  children?: React.ReactNode
  label?: string
}

export default function CreditGate({ cost, onProceed, label = 'Continue' }: CreditGateProps) {
  const { credits, isLoading } = useCredits()

  const hasCredits = credits !== null && credits >= cost

  if (isLoading) {
    return (
      <div>
        <button
          disabled
          className="bg-[#FF6B35] text-white font-semibold px-6 py-3 rounded-md opacity-50 cursor-not-allowed min-h-[44px] flex items-center gap-2"
        >
          <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
            {cost} {cost === 1 ? 'Credit' : 'Credits'}
          </span>
          {label}
        </button>
      </div>
    )
  }

  if (hasCredits) {
    return (
      <div>
        <button
          onClick={onProceed}
          className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center gap-2"
        >
          <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
            {cost} {cost === 1 ? 'Credit' : 'Credits'}
          </span>
          {label}
        </button>
        <p className="text-[#6B7280] text-xs mt-2">
          Uses {cost} credit{cost !== 1 ? 's' : ''} · {credits} remaining
        </p>
      </div>
    )
  }

  return (
    <div>
      <button
        disabled
        className="bg-[#FF6B35] text-white font-semibold px-6 py-3 rounded-md opacity-50 cursor-not-allowed min-h-[44px] flex items-center gap-2"
      >
        <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
          {cost} {cost === 1 ? 'Credit' : 'Credits'}
        </span>
        {label}
      </button>
      <p className="text-[#6B7280] text-xs mt-2">
        Uses {cost} credit{cost !== 1 ? 's' : ''} · {credits ?? 0} remaining
      </p>
      <div className="mt-3 p-4 bg-[#0F2040] border border-[#1A3A5C] rounded-lg">
        <p className="text-[#D1D5DB] text-sm mb-3">You&apos;ve used your free credits.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/billing?pack=3">
            <button className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white text-sm px-4 py-2 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]">
              3 Credits — $2.99
            </button>
          </Link>
          <Link href="/billing?pack=10">
            <button className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white text-sm px-4 py-2 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]">
              10 Credits — $8.99
            </button>
          </Link>
          <Link href="/billing?pack=25">
            <button className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white text-sm px-4 py-2 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]">
              25 Credits — $17.99
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
