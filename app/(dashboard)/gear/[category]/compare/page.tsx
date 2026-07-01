'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, GitCompareArrows } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductPickerDropdown } from '@/components/ProductPickerDropdown'
import { ComparisonResultCard } from '@/components/ComparisonResultCard'
import { LoadingProgress } from '@/components/LoadingProgress'
import { ModeChips } from '@/components/ModeChips'
import { useComparison } from '@/hooks/useComparison'
import type { CompareSlot, DBProductSlot, ExternalProductSlot, ComparisonResult } from '@/types/comparison'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function ComparePageInner() {
  const params = useParams<{ category: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const categorySlug = params.category

  const { streamedText, result, isStreaming, isComplete, error, comparisonId, reset, runComparison } = useComparison()

  const MAX_PRODUCTS = 4

  const [pastComparisons, setPastComparisons] = useState<Array<{
    id: string
    created_at: string
    winner_product_name: string | null
  }>>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('gear_comparisons')
      .select('id, created_at, winner_product_name, gear_categories!inner(slug)')
      .eq('gear_categories.slug', categorySlug)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setPastComparisons(data as Array<{ id: string; created_at: string; winner_product_name: string | null }>)
      }, () => {})
  }, [categorySlug])

  // Saved comparison state (loaded from DB via ?id=)
  const savedId = searchParams.get('id')
  const [savedResult, setSavedResult] = useState<ComparisonResult | null>(null)
  const [loadingId, setLoadingId] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const recommendationId = searchParams.get('rec') ?? undefined
  const hasRecContext = !!recommendationId
  const isQuickCompare = searchParams.get('quickcompare') === '1'

  // Parse URL params into initial slots
  function parseInitialSlots(): (CompareSlot | null)[] {
    const productsParam = searchParams.get('products') // comma-separated UUIDs
    const externalParam = searchParams.get('external') // comma-separated encoded names

    const allSlots: CompareSlot[] = []

    if (productsParam) {
      const productIdList = productsParam.split(',').filter(Boolean)
      for (let idx = 0; idx < productIdList.length; idx++) {
        const id = productIdList[idx]
        const slot: DBProductSlot = {
          productId: id,
          productName: id, // will be overridden once we know the name — placeholder
          priceUsd: 0,
          isExternal: false,
          // In quick compare mode, slot 0 is the recommendation — lock it via isFromRecommendation
          isFromRecommendation: isQuickCompare ? idx === 0 : true,
        }
        allSlots.push(slot)
      }
    }

    if (externalParam) {
      for (const name of externalParam.split(',').filter(Boolean)) {
        const slot: ExternalProductSlot = {
          productName: decodeURIComponent(name),
          isExternal: true,
          isFromRecommendation: false,
        }
        allSlots.push(slot)
      }
    }

    // Ensure at least 2 slots, cap at 4
    const result: (CompareSlot | null)[] = allSlots.slice(0, 4)
    while (result.length < 2) result.push(null)
    return result
  }

  const [slots, setSlots] = useState<(CompareSlot | null)[]>(parseInitialSlots)

  // Derived state
  const filledSlots = slots.filter(Boolean) as CompareSlot[]
  const enoughSelected = filledSlots.length >= 2

  // Slot helper functions
  function updateSlot(index: number, value: CompareSlot | null) {
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)))
  }

  function addSlot() {
    setSlots((prev) => (prev.length < MAX_PRODUCTS ? [...prev, null] : prev))
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.length > 2 ? prev.filter((_, i) => i !== index) : prev)
  }

  function getExcludedIds(slotIndex: number): string[] {
    return slots
      .filter((s, i) => i !== slotIndex && s !== null && !s.isExternal)
      .map((s) => (s as DBProductSlot).productId)
  }

  // Load saved comparison from DB when ?id= is present in URL
  useEffect(() => {
    if (!savedId) return
    setLoadingId(true)
    fetch(`/api/comparisons/${savedId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Comparison not found')
        return res.json() as Promise<{ data: { id: string; comparison_json: ComparisonResult } }>
      })
      .then(({ data }) => {
        setSavedResult(data.comparison_json)
      })
      .catch((err: Error) => {
        setLoadError(err.message ?? 'Failed to load comparison')
      })
      .finally(() => setLoadingId(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedId])

  // Push ?id= to URL after a fresh comparison completes (so it can be bookmarked/revisited)
  useEffect(() => {
    if (isComplete && comparisonId && !savedId) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('id', comparisonId)
      // Remove the products/external/rec params — they're no longer needed once saved
      params.delete('products')
      params.delete('external')
      router.replace(`/gear/${categorySlug}/compare?${params.toString()}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, comparisonId])

  // If products came from URL, fetch their names (they're UUIDs only in the URL)
  const [namesResolved, setNamesResolved] = useState(false)
  useEffect(() => {
    if (savedId) { setNamesResolved(true); return }
    const urlProducts = searchParams.get('products')
    if (!urlProducts) { setNamesResolved(true); return }

    const ids = urlProducts.split(',').filter(Boolean)
    if (ids.length === 0) { setNamesResolved(true); return }

    fetch(`/api/compare/products?category=${encodeURIComponent(categorySlug)}`)
      .then((r) => r.json())
      .then((data: { data: Array<{ id: string; brand: string; name: string; price_usd: number | null }> }) => {
        const productMap = new Map(data.data.map((p) => [p.id, p]))
        setSlots((prev) =>
          prev.map((slot) => {
            if (!slot || slot.isExternal) return slot
            const dbSlot = slot as DBProductSlot
            const product = productMap.get(dbSlot.productId)
            if (!product) return slot
            return { ...dbSlot, productName: `${product.brand} ${product.name}`, priceUsd: product.price_usd ?? 0 }
          })
        )
      })
      .catch(() => {})
      .finally(() => setNamesResolved(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canRun = enoughSelected && !isStreaming

  function handleRun() {
    const productIds: string[] = []
    const externalProducts: string[] = []

    for (const slot of filledSlots) {
      if (slot.isExternal) {
        externalProducts.push(slot.productName)
      } else {
        productIds.push((slot as DBProductSlot).productId)
      }
    }

    void runComparison(categorySlug, productIds, externalProducts, recommendationId)
  }

  function handleChangeProducts() {
    reset()
    setSavedResult(null)
    setLoadError(null)
    setSlots([null, null])
    // Clear ?id= from URL so user can run a fresh comparison
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    router.replace(`/gear/${categorySlug}/compare${params.toString() ? `?${params.toString()}` : ''}`)
  }

  if (error === 'INSUFFICIENT_CREDITS') {
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 text-center">
          <p className="text-white font-semibold mb-2">You&apos;ve used all your credits.</p>
          <p className="text-[#6B7280] text-sm mb-5">Buy a credit pack to continue comparing gear.</p>
          <a
            href="/billing"
            className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center min-h-[44px]"
          >
            Buy Credits
          </a>
        </div>
      </div>
    )
  }

  const displayResult = savedResult ?? (isComplete ? result : null)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-0">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-6"
        >
          <span>←</span> Back to Dashboard
        </Link>
        <div className="mb-6">
          <ModeChips categorySlug={categorySlug} active="compare" />
        </div>
        <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-2">
          {categorySlug.replace(/-/g, ' ')}
        </p>
        <div className="mb-4">
          <h1 className="font-display text-5xl text-white">
            {categorySlug.replace(/-/g, ' ').toUpperCase()}
          </h1>
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="bg-[#EF444410] border border-[#EF444430] rounded-lg p-4 mb-6">
          <p className="text-[#EF4444] text-sm">{loadError}</p>
        </div>
      )}

      {/* Loading saved comparison */}
      {loadingId && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8 flex items-center justify-center">
          <div className="h-6 w-48 bg-[#1A3A5C] rounded animate-pulse" />
        </div>
      )}

      {/* State: Result (fresh or saved) */}
      {displayResult && !loadingId ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {displayResult.products.map((product, i) => (
                <span key={product.productName} className="flex items-center gap-1.5">
                  {product.isExternal && <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  <span className="text-white text-sm font-semibold">{product.productName}</span>
                  {i < displayResult.products.length - 1 && <span className="text-[#6B7280] text-xs mx-1">vs</span>}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleChangeProducts}
              className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white text-sm px-4 py-2.5 rounded-md transition-all min-h-[44px]"
            >
              Change Products
            </button>
          </div>
          <ComparisonResultCard result={displayResult} categorySlug={categorySlug} />
          <p className="text-[#6B7280] text-xs mt-4">Prices shown are approximate — verify current price at retailer.</p>

          {/* Footer nav */}
          <div className="mt-4 pt-6 border-t border-[#1A3A5C] flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleChangeProducts}
              className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-5 py-3 rounded-md transition-all min-h-[44px] text-sm"
            >
              Compare Different Products
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-5 py-3 rounded-md transition-all min-h-[44px] text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : isStreaming ? (
        /* State: Streaming */
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            {filledSlots.map((slot, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {slot.isExternal && <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />}
                <span className="text-white text-sm font-semibold">{slot.productName}</span>
                {i < filledSlots.length - 1 && <span className="text-[#6B7280] text-xs mx-1">vs</span>}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-8 py-12">
            <LoadingProgress
              label="COMPARING FOR YOUR PROFILE"
              messages={categorySlug === 'nutrition' ? [
                'Reading expert review data…',
                'Analyzing carbohydrate delivery and sodium content…',
                'Matching products to your race duration…',
                'Weighing GI tolerance and flavor for long efforts…',
                'Scoring fit against your athlete profile…',
                'Identifying key tradeoffs…',
                'Writing your personalized verdict…',
              ] : categorySlug === 'wetsuits' ? [
                'Reading expert review data…',
                'Analyzing buoyancy and flexibility scores…',
                'Matching cut and sleeve type to your swim profile…',
                'Weighing fit against your body stats…',
                'Scoring against your race conditions…',
                'Identifying key tradeoffs…',
                'Writing your personalized verdict…',
              ] : categorySlug === 'running-shoes' ? [
                'Reading expert review data…',
                'Analyzing ride, cushion, and stability scores…',
                'Matching specs to your foot mechanics and mileage…',
                'Weighing late-race stability for your longest distance…',
                'Scoring fit against your athlete profile…',
                'Identifying key tradeoffs…',
                'Writing your personalized verdict…',
              ] : categorySlug === 'gps-watches' ? [
                'Reading expert review data…',
                'Analyzing GPS accuracy scores…',
                'Matching specs to your race distance…',
                'Weighing battery life for your longest event…',
                'Scoring fit against your athlete profile…',
                'Identifying key tradeoffs…',
                'Writing your personalized verdict…',
              ] : [
                // Generic fallback for future categories without dedicated copy
                'Reading expert review data…',
                'Matching specs to your race distance…',
                'Scoring fit against your athlete profile…',
                'Identifying key tradeoffs…',
                'Writing your personalized verdict…',
              ]}
              isComplete={isComplete}
              streamProgress={streamedText.length / 3500}
            />
          </div>
        </div>
      ) : (
        /* State: Picker */
        <div className="flex flex-col gap-6">
          {/* Quick Compare credit callout */}
          {isQuickCompare && (
            <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4 flex items-start gap-3">
              <div className="w-1 rounded-full bg-[#22C55E] shrink-0 self-stretch" />
              <div>
                <p className="text-white text-sm font-semibold mb-1">Quick Compare — free for your first shoe</p>
                <p className="text-[#9CA3AF] text-sm">
                  Comparing our recommendation against 1 shoe you had in mind is free.
                  Add a 2nd shoe — 1 credit. Add a 3rd shoe — 2 credits.
                </p>
              </div>
            </div>
          )}

          {/* Personalization callout */}
          <div className="bg-[#FF6B3510] border border-[#FF6B3530] rounded-lg p-4 flex gap-3">
            <div className="w-1 rounded-full bg-[#FF6B35] shrink-0 self-stretch" />
            <div>
              <p className="text-white text-sm font-semibold mb-1">
                {hasRecContext ? 'Personalized to your profile & questionnaire answers' : 'Personalized to your athlete profile'}
              </p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">
                {hasRecContext
                  ? 'This comparison factors in your race goals, swim ability, budget, and every answer from your questionnaire — not just specs.'
                  : 'Every comparison is matched to your body stats, race distances, experience level, and budget. Run a recommendation first to also include your questionnaire answers for even deeper context.'}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && error !== 'INSUFFICIENT_CREDITS' && (
            <div className="bg-[#EF444410] border border-[#EF444430] rounded-lg p-4">
              <p className="text-[#EF4444] text-sm">{error}</p>
            </div>
          )}

          {/* Product pickers */}
          <div className={`grid gap-4 ${
            slots.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            slots.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            slots.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {slots.map((slot, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold">
                    Product {String.fromCharCode(65 + i)}
                  </p>
                  {slots.length > 2 && !(isQuickCompare && i === 0) && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="text-[#6B7280] hover:text-[#EF4444] text-xs transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {isQuickCompare && i === 0 ? (
                  <div className="bg-[#0F2040] border border-[#FF6B35]/40 rounded-lg p-4 flex flex-col gap-1.5 min-h-[72px]">
                    <span className="text-[#FF6B35] text-xs font-semibold uppercase tracking-widest">Our Recommendation</span>
                    <span className="text-white text-sm font-semibold">{slot?.productName ?? '…'}</span>
                    {slot && !slot.isExternal && (slot as DBProductSlot).priceUsd > 0 && (
                      <span className="text-[#9CA3AF] text-xs">${(slot as DBProductSlot).priceUsd.toLocaleString()}</span>
                    )}
                  </div>
                ) : (
                  <ProductPickerDropdown
                    category={categorySlug}
                    value={slot}
                    onChange={(v) => updateSlot(i, v)}
                    onClear={() => updateSlot(i, null)}
                    excludeProductIds={getExcludedIds(i)}
                    placeholder="Select or enter a product"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Add slot button */}
          {slots.length < MAX_PRODUCTS && (
            <button
              type="button"
              onClick={addSlot}
              className="w-full border border-dashed border-[#1A3A5C] hover:border-[#FF6B35] text-[#6B7280] hover:text-white px-4 py-3 rounded-md transition-all text-sm flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span className="text-lg leading-none">+</span>
              {isQuickCompare
                ? 'Add another shoe to compare (+1 credit for 3rd · +2 credits for 4th)'
                : 'Add another product (up to 4)'}
            </button>
          )}

          {/* Selected chips preview */}
          {enoughSelected && namesResolved && (
            <div className="flex items-center justify-center gap-3 flex-wrap bg-[#0A1628] border border-[#1A3A5C] rounded-lg p-4">
              {filledSlots.map((slot, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {slot.isExternal && <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  <span className="text-white text-sm font-semibold">{slot.productName}</span>
                  {i < filledSlots.length - 1 && (
                    <span className="text-[#6B7280] text-xs font-semibold uppercase tracking-widest ml-1">vs</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleRun}
            disabled={!canRun}
            className="w-full bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center justify-center gap-2 text-lg"
          >
            <GitCompareArrows className="w-5 h-5" />
            {isQuickCompare && enoughSelected
              ? 'Compare Our Pick vs Yours'
              : enoughSelected
              ? 'Run Comparison'
              : 'Select at least 2 products to compare'}
          </button>

          {pastComparisons.length > 0 && (
            <div className="mt-4">
              <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-3">Past Comparisons</p>
              <div className="flex flex-col gap-2">
                {pastComparisons.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/gear/${categorySlug}/compare?id=${comp.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-md border border-[#1A3A5C] hover:border-[#FF6B35] hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 transition-all duration-200 group"
                  >
                    <div>
                      {comp.winner_product_name && (
                        <p className="text-white text-sm font-semibold group-hover:text-[#FF6B35] transition-colors">
                          Winner: {comp.winner_product_name}
                        </p>
                      )}
                      <p className="text-[#9CA3AF] text-sm">{formatDate(comp.created_at)}</p>
                    </div>
                    <span className="text-[#6B7280] text-xs group-hover:text-[#FF6B35] transition-colors">View →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="text-center text-[#6B7280] text-xs py-6 border-t border-[#1A3A5C] mt-12">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </footer>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="h-8 bg-[#0F2040] rounded animate-pulse mb-4 w-48" />
        <div className="h-64 bg-[#0F2040] rounded animate-pulse" />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  )
}
