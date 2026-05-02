import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'

interface ComparisonLauncherProps {
  categorySlug: string
  categoryName?: string
}

export function ComparisonLauncher({ categorySlug, categoryName }: ComparisonLauncherProps) {
  const label = categoryName
    ? `Compare ${categoryName} products`
    : 'Compare products'

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
        href={`/gear/${categorySlug}/compare`}
        className="w-full bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2"
      >
        <GitCompareArrows className="w-4 h-4" />
        {label}
      </Link>
    </div>
  )
}
