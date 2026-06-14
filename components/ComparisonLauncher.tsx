import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'

interface ComparisonLauncherProps {
  categorySlug: string
  categoryName?: string
  topPickId?: string
  runnerUpId?: string
  recommendationId?: string
}

export function ComparisonLauncher({
  categorySlug,
  categoryName,
  topPickId,
  runnerUpId,
  recommendationId,
}: ComparisonLauncherProps) {
  const label = categoryName
    ? `Compare ${categoryName} products`
    : 'Compare products'

  // Standard compare: pre-populate top pick + runner-up
  let compareHref = `/gear/${categorySlug}/compare`
  const params = new URLSearchParams()
  if (topPickId && runnerUpId) {
    params.set('products', `${topPickId},${runnerUpId}`)
  }
  if (recommendationId) {
    params.set('rec', recommendationId)
  }
  if (params.toString()) compareHref += `?${params.toString()}`

  // Quick compare: our top pick vs. a product the user had in mind — free
  let quickCompareHref: string | null = null
  if (topPickId && recommendationId) {
    quickCompareHref =
      `/gear/${categorySlug}/compare?products=${topPickId}&rec=${recommendationId}&quickcompare=1`
  }

  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <GitCompareArrows className="w-4 h-4 text-[#FF6B35] shrink-0" />
        <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold">
          Side-by-Side Comparison
        </p>
      </div>

      <p className="text-[#D1D5DB] text-sm mb-4 leading-relaxed">
        Compare this recommendation against any product in our catalog — or enter one not in our database.
      </p>

      <Link
        href={compareHref}
        className="w-full bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2"
      >
        <GitCompareArrows className="w-4 h-4" />
        {label}
      </Link>

      {quickCompareHref && (
        <Link
          href={quickCompareHref}
          className="w-full mt-3 border border-[#1A3A5C] hover:border-[#FF6B35] text-[#9CA3AF] hover:text-white text-sm font-medium px-6 py-2.5 rounded-md transition-all min-h-[44px] flex items-center justify-center gap-2"
        >
          <span className="text-[#22C55E] text-xs font-semibold uppercase tracking-wide">Free</span>
          Compare vs. a product I had in mind
        </Link>
      )}
    </div>
  )
}
