'use client'

import { useState, useMemo } from 'react'
import { Waves, Watch, Eye, Shirt, Footprints, Zap, Bike, Package } from 'lucide-react'
import type { GearCategory } from '@/types/gear'
import type { AthleteProfile } from '@/types/profile'
import { CategoryActionModal } from './CategoryActionModal'
import { useAthleteProfile } from '@/hooks/useAthleteProfile'

interface CategoryGridProps {
  categories: GearCategory[]
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Waves: <Waves className="w-5 h-5" />,
  Watch: <Watch className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Footprints: <Footprints className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Bike: <Bike className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
}

function getCategoryIcon(iconName: string | null): React.ReactNode {
  if (!iconName) return <Package className="w-5 h-5" />
  return ICON_MAP[iconName] ?? <Package className="w-5 h-5" />
}

function getCategoryPriority(category: GearCategory, profile: AthleteProfile | null): number {
  if (!profile || !category.relevant_sports || category.relevant_sports.length === 0) {
    return 2
  }

  if (profile.current_focus_sport && category.relevant_sports.includes(profile.current_focus_sport)) {
    return 0
  }

  if (profile.sports && profile.sports.some((sport) => category.relevant_sports.includes(sport))) {
    return 1
  }

  return 2
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [openCategory, setOpenCategory] = useState<GearCategory | null>(null)
  const { profile } = useAthleteProfile()
  const active = categories.filter((c) => c.is_active)
  const comingSoon = categories.filter((c) => !c.is_active)

  const sortedActive = useMemo(() => {
    if (!profile) return active
    return [...active].sort((a, b) => {
      const aPriority = getCategoryPriority(a, profile)
      const bPriority = getCategoryPriority(b, profile)
      return aPriority - bPriority
    })
  }, [active, profile])

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedActive.map((category) => {
          const priority = getCategoryPriority(category, profile)
          const isTertiary = priority === 2
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setOpenCategory(category)}
              className={`text-left bg-[#0F2040] border border-[#1A3A5C] hover:border-[#FF6B35] rounded-xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 duration-200 focus:outline-none focus-visible:border-[#FF6B35] focus-visible:shadow-xl relative ${isTertiary ? 'opacity-50' : ''}`}
            >
              {isTertiary && (
                <span className="absolute top-3 right-3 text-[#6B7280] text-xs font-semibold uppercase tracking-wider bg-[#0A1628] px-2 py-1 rounded">
                  Not for your sports
                </span>
              )}
              <div className="w-10 h-10 rounded-lg bg-[#FF6B3520] flex items-center justify-center shrink-0 text-[#FF6B35]">
                {getCategoryIcon(category.icon_name)}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-4xl text-white leading-none">
                  {category.name.toUpperCase()}
                </h3>
                {category.description && (
                  <p className="text-[#9CA3AF] text-sm mt-2 leading-relaxed line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {comingSoon.length > 0 && (
        <div className="mt-10">
          <p className="text-[#6B7280] text-xs uppercase tracking-widest font-semibold mb-3">Coming Soon</p>
          <div className="flex flex-wrap gap-2">
            {comingSoon.map((category) => (
              <div
                key={category.id}
                className="inline-flex items-center gap-2 border border-dashed border-[#1A3A5C] rounded-full px-4 py-2 opacity-50 select-none"
              >
                <span className="text-[#6B7280]">{getCategoryIcon(category.icon_name)}</span>
                <span className="text-[#6B7280] text-sm font-medium">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CategoryActionModal category={openCategory} onClose={() => setOpenCategory(null)} />
    </div>
  )
}
