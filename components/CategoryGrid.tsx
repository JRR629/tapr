import Link from 'next/link'
import { Waves, Watch, Eye, Shirt, Footprints, Zap, Bike, Package } from 'lucide-react'
import type { GearCategory } from '@/types/gear'

interface CategoryGridProps {
  categories: GearCategory[]
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Waves: <Waves className="w-6 h-6" />,
  Watch: <Watch className="w-6 h-6" />,
  Eye: <Eye className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Footprints: <Footprints className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Bike: <Bike className="w-6 h-6" />,
  Package: <Package className="w-6 h-6" />,
}

function getCategoryIcon(iconName: string | null): React.ReactNode {
  if (!iconName) return <Package className="w-6 h-6" />
  return ICON_MAP[iconName] ?? <Package className="w-6 h-6" />
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const active = categories.filter((c) => c.is_active)
  const comingSoon = categories.filter((c) => !c.is_active)

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {active.map((category) => (
          <Link
            key={category.id}
            href={`/gear/${category.slug}`}
            className="group bg-[#0F2040] border border-[#1A3A5C] hover:border-[#FF6B35] rounded-lg p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 duration-200 flex items-start gap-4"
          >
            <span className="text-[#FF6B35] mt-0.5 shrink-0">
              {getCategoryIcon(category.icon_name)}
            </span>
            <div>
              <h3 className="font-display text-2xl text-white group-hover:text-[#FF6B35] transition-colors leading-tight">
                {category.name.toUpperCase()}
              </h3>
              {category.description && (
                <p className="text-[#9CA3AF] text-base mt-1 leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {comingSoon.length > 0 && (
        <>
          <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-3">Coming Soon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comingSoon.map((category) => (
              <div
                key={category.id}
                className="bg-[#0F2040] border border-dashed border-[#1A3A5C] rounded-lg p-5 opacity-50 flex items-center gap-4 cursor-not-allowed select-none"
              >
                <span className="text-[#6B7280] shrink-0">
                  {getCategoryIcon(category.icon_name)}
                </span>
                <span className="font-display text-xl text-[#6B7280]">{category.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
