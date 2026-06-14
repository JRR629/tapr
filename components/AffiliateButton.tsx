'use client'

import { useState } from 'react'
import { useAffiliateClick } from '@/hooks/useAffiliateClick'

interface AffiliateButtonProps {
  productId: string
  recommendationId?: string
  categorySlug?: string
  label?: string
  className?: string
}

export function AffiliateButton({
  productId,
  recommendationId,
  categorySlug,
  label = 'Shop Now',
  className,
}: AffiliateButtonProps) {
  const { trackClick } = useAffiliateClick()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    try {
      await trackClick(productId, recommendationId, categorySlug)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={
          className ??
          'bg-[#FF6B35] hover:bg-[#E55A24] disabled:bg-[#FF6B3580] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] inline-flex items-center gap-2'
        }
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Opening…
          </>
        ) : (
          label
        )}
      </button>
      {/* Disclosure moved to consolidated band on recommendation page */}
    </div>
  )
}
