import { formatPrice } from '@/lib/utils'
import type { GearProduct } from '@/types/gear'

interface ProductCardProps {
  product: GearProduct
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
      <h3 className="font-display text-2xl text-white">{product.name.toUpperCase()}</h3>
      <p className="text-[#6B7280] text-sm">{product.brand}</p>
      {product.price_usd && (
        <p className="font-mono text-[#FF6B35] mt-2">${formatPrice(product.price_usd)}</p>
      )}
    </div>
  )
}
