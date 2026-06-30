'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, Search, Zap } from 'lucide-react'
import type { CompareSlot, DBProductSlot, ExternalProductSlot } from '@/types/comparison'
import type { GearProduct } from '@/types/gear'

interface ProductPickerDropdownProps {
  category: string
  value: CompareSlot | null
  onChange: (slot: CompareSlot) => void
  onClear: () => void
  excludeProductIds: string[] // DB product IDs already selected in other slots
  placeholder?: string
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  previous_gen: { label: 'Prev. Gen', color: 'text-[#F59E0B] bg-[#F59E0B15] border-[#F59E0B40]' },
  limited: { label: 'Hard to Find', color: 'text-[#EF4444] bg-[#EF444415] border-[#EF444440]' },
}

export function ProductPickerDropdown({
  category,
  value,
  onChange,
  onClear,
  excludeProductIds,
  placeholder = 'Select a product',
}: ProductPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState<GearProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [externalName, setExternalName] = useState('')
  const [showExternalInput, setShowExternalInput] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  // Load products when dropdown opens
  useEffect(() => {
    if (!isOpen || products.length > 0) return
    setLoading(true)

    fetch(`/api/compare/products?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data: { data: GearProduct[] }) => {
        setProducts(data.data ?? [])
      })
      .catch(() => {
        // leave empty — user can still use external input
      })
      .finally(() => setLoading(false))
  }, [isOpen, category, products.length])

  const filteredProducts = products.filter((p) => {
    if (excludeProductIds.includes(p.id)) return false
    if (!searchQuery) return true
    const haystack = `${p.brand} ${p.name}`.toLowerCase()
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/)
    return tokens.every((token) => haystack.includes(token))
  })

  function selectDBProduct(product: GearProduct) {
    const nameAlreadyHasBrand = product.name.toLowerCase().startsWith(product.brand.toLowerCase())
    const slot: DBProductSlot = {
      productId: product.id,
      productName: nameAlreadyHasBrand ? product.name : `${product.brand} ${product.name}`,
      priceUsd: product.price_usd ?? 0,
      isExternal: false,
      isFromRecommendation: false,
    }
    onChange(slot)
    setIsOpen(false)
    setSearchQuery('')
  }

  function submitExternalProduct() {
    const name = externalName.trim()
    if (!name) return
    const slot: ExternalProductSlot = {
      productName: name,
      isExternal: true,
      isFromRecommendation: false,
    }
    onChange(slot)
    setIsOpen(false)
    setExternalName('')
    setShowExternalInput(false)
  }

  // Current slot chip
  const chipLabel = value
    ? value.productName
    : placeholder

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-full flex items-center justify-between gap-3 bg-[#0F2040] border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-4 py-3 rounded-md transition-all min-h-[44px] focus:outline-none focus:border-[#FF6B35] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)]"
      >
        <span className="flex items-center gap-2 min-w-0">
          {value?.isExternal && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-[#F59E0B15] text-[#F59E0B] border-[#F59E0B40] uppercase tracking-wide">
              AI
            </span>
          )}
          {value ? (
            <span className="flex flex-col items-start min-w-0">
              <span className="truncate text-sm text-white leading-snug">{chipLabel}</span>
              {!value.isExternal && (value as DBProductSlot).priceUsd > 0 && (
                <span className="text-[#6B7280] text-xs font-mono">
                  ${(value as DBProductSlot).priceUsd.toLocaleString()}
                </span>
              )}
            </span>
          ) : (
            <span className="truncate text-sm text-[#9CA3AF]">{chipLabel}</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onClear() }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClear() } }}
              className="text-[#6B7280] hover:text-white transition-colors p-1 rounded"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#0F2040] border border-[#1A3A5C] rounded-lg shadow-xl shadow-black/40 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-[#1A3A5C]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by brand or model..."
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] text-sm rounded-md pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#FF6B35] focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)]"
                autoFocus
              />
            </div>
          </div>

          {/* Products list */}
          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center">
                <div className="w-5 h-5 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredProducts.length === 0 && !searchQuery ? (
              <p className="text-[#6B7280] text-sm text-center py-6 px-4">No products found in this category</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-[#6B7280] text-sm text-center py-4 px-4">No matches — try the external product option below</p>
            ) : (
              filteredProducts.map((product) => {
                const availBadge = product.availability_status ? AVAILABILITY_LABELS[product.availability_status] : null
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectDBProduct(product)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#0A1628] transition-colors text-left border-b border-[#1A3A5C] last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{product.brand} {product.name}</p>
                      <p className="text-[#6B7280] text-xs">
                        {product.price_usd ? `$${product.price_usd.toLocaleString()}` : 'Price varies'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {availBadge && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${availBadge.color}`}>
                          {availBadge.label}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* External product input */}
          <div className="border-t border-[#1A3A5C] p-3">
            {!showExternalInput ? (
              <button
                type="button"
                onClick={() => setShowExternalInput(true)}
                className="w-full flex items-center gap-2 text-[#6B7280] hover:text-[#FF6B35] text-sm py-2 px-2 rounded transition-colors"
              >
                <Zap className="w-4 h-4" />
                Don&apos;t see your product? Enter brand + model
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[#6B7280] text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="text-[#F59E0B] font-semibold">AI Knowledge</span>
                  — Claude will analyze this from its training data
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitExternalProduct() }}
                    placeholder='e.g. "Polar Vantage V3"'
                    className="flex-1 bg-[#0A1628] border border-[#F59E0B60] text-white placeholder-[#6B7280] text-sm rounded-md px-3 py-2.5 focus:outline-none focus:border-[#F59E0B] min-w-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={submitExternalProduct}
                    disabled={!externalName.trim()}
                    className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm px-4 py-2.5 rounded-md transition-colors shrink-0 min-h-[44px]"
                  >
                    Add
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowExternalInput(false); setExternalName('') }}
                  className="text-[#6B7280] hover:text-white text-xs transition-colors text-left"
                >
                  ← Back to product list
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
