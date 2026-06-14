'use client'

import Link from 'next/link'
import { useCredits } from '@/hooks/useCredits'

export default function CreditBalance() {
  const { credits, isLoading } = useCredits()

  return (
    <Link href="/billing">
      <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide cursor-pointer hover:bg-[rgba(255,107,53,0.2)] transition-colors">
        {isLoading ? '—' : `${credits} Credits`}
      </span>
    </Link>
  )
}
