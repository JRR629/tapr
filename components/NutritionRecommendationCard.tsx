'use client'

import { useState } from 'react'
import { Info, Flag, PlusCircle } from 'lucide-react'
import { AffiliateButton } from '@/components/AffiliateButton'
import { ReportCorrectionModal } from '@/components/ReportCorrectionModal'
import { SuggestProductModal } from '@/components/SuggestProductModal'
import type { NutritionResult, NutritionResultTriSplit, NutritionResultTriUnified, NutritionResultSingle, NutritionOption, NutritionSupplement } from '@/types/recommendation'

interface NutritionRecommendationCardProps {
  result: NutritionResult
  recommendationId?: string
  categorySlug?: string
}

function ConfidenceIndicator({ level, reason }: { level: 'high' | 'medium' | 'low'; reason?: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const config = {
    high: { label: 'High Confidence', color: 'text-[#22C55E]', dotColor: 'bg-[#22C55E]' },
    medium: { label: 'Medium Confidence', color: 'text-[#F59E0B]', dotColor: 'bg-[#F59E0B]' },
    low: { label: 'Low Confidence', color: 'text-[#EF4444]', dotColor: 'bg-[#EF4444]' },
  }[level]
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {(['high', 'medium', 'low'] as const).map((l, i) => {
            const filled = level === 'high' ? i <= 2 : level === 'medium' ? i <= 1 : i === 0
            return <span key={l} className={`w-2 h-2 rounded-full ${filled ? config.dotColor : 'bg-[#1A3A5C]'}`} />
          })}
        </div>
        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[#6B7280] hover:text-white transition-colors p-1 -m-1"
          aria-label="What does this confidence level mean?"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="mt-2 p-3 bg-[#0A1628] border border-[#1A3A5C] rounded-md text-xs leading-relaxed text-[#9CA3AF] max-w-sm">
          <p className="mb-1.5"><span className="text-[#22C55E] font-semibold">High</span> — strong consensus across independent expert reviews of this product.</p>
          <p className="mb-1.5"><span className="text-[#F59E0B] font-semibold">Medium</span> — partial or limited review coverage; recommendation is solid but the data set is thinner.</p>
          <p className="mb-1.5"><span className="text-[#EF4444] font-semibold">Low</span> — significant gaps in available data; treat this as a best-effort suggestion.</p>
          {reason && <p className="mt-2 pt-2 border-t border-[#1A3A5C] text-[#D1D5DB]"><span className="text-white font-semibold">For this pick:</span> {reason}</p>}
        </div>
      )}
    </div>
  )
}

function OptionCard({
  option,
  recommendationId,
  categorySlug,
}: {
  option: NutritionOption
  recommendationId?: string
  categorySlug?: string
}) {
  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4 flex flex-col gap-3 hover:-translate-y-1 hover:border-[#FF6B35] transition-all duration-200">
      <div>
        <h3 className="font-display text-2xl text-white leading-tight">{(option.productName ?? '').toUpperCase()}</h3>
        <p className="font-mono text-[#FF6B35] text-lg mt-0.5">${(option.priceUsd ?? 0).toLocaleString()}</p>
      </div>
      {option.productId && (
        <AffiliateButton
          productId={option.productId}
          recommendationId={recommendationId}
          categorySlug={categorySlug}
          label="Shop Now"
        />
      )}
      <p className="text-[#D1D5DB] text-sm leading-relaxed">{option.whyItWorks}</p>
      {option.differentiator && (
        <span className="inline-block self-start bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-xs px-2.5 py-1 rounded-full">
          {option.differentiator}
        </span>
      )}
    </div>
  )
}

function OptionsSection({
  label,
  options,
  recommendationId,
  categorySlug,
}: {
  label: string
  options: NutritionOption[]
  recommendationId?: string
  categorySlug?: string
}) {
  if (!options || options.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-2xl text-white">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {options.map((option) => (
          <OptionCard
            key={option.productId ?? option.productName}
            option={option}
            recommendationId={recommendationId}
            categorySlug={categorySlug}
          />
        ))}
      </div>
    </div>
  )
}

function SupplementCard({
  supplement,
  recommendationId,
  categorySlug,
}: {
  supplement: NutritionSupplement
  recommendationId?: string
  categorySlug?: string
}) {
  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
      <span className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-wide">Long Race Supplement</span>
      <h4 className="font-display text-2xl text-white mt-2 leading-tight">{(supplement.productName ?? '').toUpperCase()}</h4>
      <p className="font-mono text-[#9CA3AF] text-base mt-1">${(supplement.priceUsd ?? 0).toLocaleString()}*</p>
      <p className="text-[#D1D5DB] text-sm mt-2 leading-relaxed">{supplement.whenToUse}</p>
      {supplement.productId && (
        <div className="mt-3">
          <AffiliateButton
            productId={supplement.productId}
            recommendationId={recommendationId}
            categorySlug={categorySlug}
            label="Buy Now"
          />
        </div>
      )}
    </div>
  )
}

function SourcesSection({ sources }: { sources: Array<{ name: string; url?: string } | string> }) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="px-1">
      <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Sources Cited</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => {
          const name = typeof source === 'string' ? source : source.name
          const url = typeof source === 'string' ? undefined : source.url
          return url ? (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#0A1628] border border-[#1A3A5C] hover:border-[#FF6B35] text-[#9CA3AF] hover:text-white text-xs px-3 py-1 rounded-full transition-colors"
            >
              {name}
            </a>
          ) : (
            <span key={name} className="bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-xs px-3 py-1 rounded-full">
              {name}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function NutritionRecommendationCard({ result, recommendationId, categorySlug }: NutritionRecommendationCardProps) {
  const sportLabel = result.sport === 'triathlon' ? 'TRIATHLON' : result.sport === 'cycling' ? 'CYCLING' : 'RUNNING'
  const durationLabel = result.raceDuration?.toUpperCase() ?? ''
  const [reportOpen, setReportOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">

      {/* Context bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-[#0F2040] border border-[#1A3A5C] text-[#FF6B35] text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide">
          {sportLabel}
        </span>
        {durationLabel && (
          <span className="bg-[#0F2040] border border-[#1A3A5C] text-[#9CA3AF] text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide">
            {durationLabel}
          </span>
        )}
      </div>

      {/* Fueling strategy — shown first as context for the product options below */}
      {result.fuelingStrategy && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
          <p className="font-display text-2xl text-white mb-3">YOUR FUELING STRATEGY</p>
          <p className="text-[#D1D5DB] leading-relaxed">{result.fuelingStrategy}</p>
        </div>
      )}

      {/* Single intro line — shown once above all product sections */}
      <p className="text-[#9CA3AF] text-sm">
        These products all meet your specs. Nutrition is personal — try one and see what works for your gut.
      </p>

      {/* Options — layout depends on strategy */}
      {result.strategy === 'split' && (() => {
        const r = result as NutritionResultTriSplit
        return (
          <div className="flex flex-col gap-6">
            <OptionsSection
              label="OPTIONS FOR YOUR BIKE LEG"
              options={r.bikeOptions ?? []}
              recommendationId={recommendationId}
              categorySlug={categorySlug}
            />
            <OptionsSection
              label="OPTIONS FOR YOUR RUN LEG"
              options={r.runOptions ?? []}
              recommendationId={recommendationId}
              categorySlug={categorySlug}
            />
          </div>
        )
      })()}

      {result.strategy === 'unified' && (() => {
        const r = result as NutritionResultTriUnified
        return (
          <OptionsSection
            label="OPTIONS THAT WORK FOR BOTH LEGS"
            options={r.viableOptions ?? []}
            recommendationId={recommendationId}
            categorySlug={categorySlug}
          />
        )
      })()}

      {result.strategy === 'single' && (() => {
        const r = result as NutritionResultSingle
        const sportSubtitle = result.sport === 'running' ? 'running' : 'your ride'
        return (
          <OptionsSection
            label={`OPTIONS FOR ${sportSubtitle.toUpperCase()}`}
            options={r.viableOptions ?? []}
            recommendationId={recommendationId}
            categorySlug={categorySlug}
          />
        )
      })()}

      {/* Long race supplement */}
      {result.longRaceSupplement && result.longRaceSupplement.productName && (
        <SupplementCard
          supplement={result.longRaceSupplement}
          recommendationId={recommendationId}
          categorySlug={categorySlug}
        />
      )}

      {/* Sources + confidence */}
      <SourcesSection sources={result.sourcesDrawnFrom} />
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
        <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Recommendation Confidence</p>
        <ConfidenceIndicator level={result.confidenceLevel} reason={result.lowConfidenceReason} />
      </div>

      {/* Profile warnings */}
      {result.profileSpecificWarnings && result.profileSpecificWarnings.length > 0 && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3 font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Profile Notes
          </p>
          <ul className="flex flex-col gap-2">
            {result.profileSpecificWarnings.map((w) => (
              <li key={w} className="flex gap-2 items-start">
                <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#FF6B35] block" />
                <p className="text-[#D1D5DB] text-sm leading-relaxed">{w}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback footer */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#1A3A5C] flex-wrap">
        {categorySlug && (
          <button
            type="button"
            onClick={() => setSuggestOpen(true)}
            className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#9CA3AF] text-sm transition-colors min-h-[44px] px-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Suggest a product
          </button>
        )}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#9CA3AF] text-sm transition-colors min-h-[44px] px-2 ml-auto"
        >
          <Flag className="w-3.5 h-3.5" />
          Report an issue
        </button>
      </div>

      {categorySlug && (
        <SuggestProductModal
          categorySlug={categorySlug}
          categoryLabel={categorySlug}
          isOpen={suggestOpen}
          onClose={() => setSuggestOpen(false)}
        />
      )}
      <ReportCorrectionModal
        recommendationId={recommendationId}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  )
}
