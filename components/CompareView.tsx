'use client'

import type { GearProduct } from '@/types/gear'

interface CompareViewProps {
  productA: GearProduct
  productB: GearProduct
}

export function CompareView({ productA, productB }: CompareViewProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-6">
        <h3 className="font-display text-2xl text-white">{productA.name.toUpperCase()}</h3>
      </div>
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
        <h3 className="font-display text-2xl text-white">{productB.name.toUpperCase()}</h3>
      </div>
    </div>
  )
}
