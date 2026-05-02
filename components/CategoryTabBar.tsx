'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface CategoryTabBarProps {
  categorySlug: string
  categoryName: string
}

export function CategoryTabBar({ categorySlug, categoryName }: CategoryTabBarProps) {
  const pathname = usePathname()

  const isCompare = pathname.startsWith(`/gear/${categorySlug}/compare`)

  return (
    <div className="border-b border-[#1A3A5C] mb-8">
      <div className="flex items-center gap-1">
        <Link
          href={`/gear/${categorySlug}`}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            !isCompare
              ? 'border-[#FF6B35] text-[#FF6B35]'
              : 'border-transparent text-[#6B7280] hover:text-white'
          }`}
        >
          Recommend
        </Link>
        <Link
          href={`/gear/${categorySlug}/compare`}
          className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            isCompare
              ? 'border-[#FF6B35] text-[#FF6B35]'
              : 'border-transparent text-[#6B7280] hover:text-white'
          }`}
        >
          Compare
          <span className="bg-[#FF6B3520] text-[#FF6B35] text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            Pro
          </span>
        </Link>
      </div>
    </div>
  )
}
