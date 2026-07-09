'use client'

import { useState } from 'react'
import { Info, ExternalLink, ChevronDown, ChevronUp, Flag, PlusCircle } from 'lucide-react'
import { AffiliateButton } from '@/components/AffiliateButton'
import { ComparisonLauncher } from '@/components/ComparisonLauncher'
import { ReportCorrectionModal } from '@/components/ReportCorrectionModal'
import { SuggestProductModal } from '@/components/SuggestProductModal'
import { formatPrice } from '@/lib/utils'
import type { RecommendationTopPick, RecommendationRunnerUp, RecommendationUpgradeOption } from '@/types/recommendation'

interface RecommendationCardProps {
  topPick: RecommendationTopPick
  runnerUp: RecommendationRunnerUp
  upgradeOption?: RecommendationUpgradeOption
  profileSpecificWarnings: string[]
  sourcesDrawnFrom: Array<{ name: string; url?: string } | string>
  confidenceLevel: 'high' | 'medium' | 'low'
  lowConfidenceReason?: string
  appleEcosystemNote?: string | null
  recommendationId?: string
  categorySlug?: string
}

function ConfidenceIndicator({ level, reason }: { level: 'high' | 'medium' | 'low'; reason?: string }) {
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
            return (
              <span
                key={l}
                className={`w-2 h-2 rounded-full ${filled ? config.dotColor : 'bg-[#1A3A5C]'}`}
              />
            )
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

function CollapsibleRow({
  label,
  accentColor,
  headerContent,
  children,
}: {
  label: string
  accentColor: string
  headerContent: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1A3A5C20] transition-colors min-h-[44px]"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs font-semibold uppercase tracking-wide shrink-0 ${accentColor}`}>
            {label}
          </span>
          <div className="flex-1 min-w-0">{headerContent}</div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#6B7280] shrink-0 ml-3" />
          : <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0 ml-3" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[#1A3A5C]">
          {children}
        </div>
      )}
    </div>
  )
}

export function RecommendationCard({
  topPick,
  runnerUp,
  upgradeOption,
  profileSpecificWarnings,
  sourcesDrawnFrom,
  confidenceLevel,
  lowConfidenceReason,
  appleEcosystemNote,
  recommendationId,
  categorySlug,
}: RecommendationCardProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">

      {/* ── TOP PICK ── */}
      <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-6">
        {/* Label + Confidence on same line */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <span className="bg-[#FF6B3520] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
            Top Pick
          </span>
          <ConfidenceIndicator level={confidenceLevel} reason={lowConfidenceReason} />
        </div>

        {/* Product name */}
        <h2 className="font-display text-4xl text-white leading-tight mb-4">
          {topPick.productName.toUpperCase()}
        </h2>

        <div className="mb-5">
          <p className="font-mono text-[#FF6B35] text-2xl">${formatPrice(topPick.priceUsd)}</p>
        </div>

        <div className="mb-5">
          {topPick.alreadyOwned ? (
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 bg-[#052e16] border border-[#166534] text-[#86efac] text-sm font-semibold px-4 py-2.5 rounded-md w-fit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                You already own this
              </div>
              <p className="text-[#9CA3AF] text-sm">Based on your profile, this is the right choice for your race and goals. See the runner-up below if you&apos;re looking for an alternative.</p>
            </div>
          ) : (
            <AffiliateButton
              productId={topPick.productId}
              recommendationId={recommendationId}
              categorySlug={categorySlug}
              label="Shop Now"
             
            />
          )}
        </div>

        <p className="text-[#D1D5DB] leading-relaxed mb-5">{topPick.personalizedReason}</p>

        {(topPick.keyStrengths.length > 0 || topPick.keyWeaknesses.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {topPick.keyStrengths.length > 0 && (
              <div>
                <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-2">
                  Strengths for you
                </p>
                <ul className="flex flex-col gap-1.5">
                  {topPick.keyStrengths.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="text-[#86efac] font-bold mt-0.5 shrink-0">+</span>
                      <span className="text-[#86efac] text-sm leading-snug">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {topPick.keyWeaknesses.length > 0 && (
              <div>
                <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-2">
                  Weaknesses for you
                </p>
                <ul className="flex flex-col gap-1.5">
                  {topPick.keyWeaknesses.map((w) => (
                    <li key={w} className="flex items-start gap-2">
                      <span className="text-[#fca5a5] font-bold mt-0.5 shrink-0">−</span>
                      <span className="text-[#fca5a5] text-sm leading-snug">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {topPick.oneHonestCaveat && (
          <div className="border-l-2 border-[#FF6B35] bg-[#FF6B3508] rounded-r-md px-4 py-3">
            <p className="text-[#D1D5DB] text-base">
              <span className="text-[#FF6B35] font-semibold">One thing to know: </span>
              {topPick.oneHonestCaveat}
            </p>
          </div>
        )}
      </div>

      {/* ── RUNNER UP — collapsible ── */}
      <CollapsibleRow
        label="Runner Up"
        accentColor="text-[#9CA3AF]"
        headerContent={
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-display text-xl text-white leading-tight truncate">
              {runnerUp.productName.toUpperCase()}
            </span>
            <span className="font-mono text-[#9CA3AF] text-sm shrink-0">
              ${formatPrice(runnerUp.priceUsd)}*
            </span>
          </div>
        }
      >
        <div className="pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {runnerUp.alreadyOwned ? (
              <div className="inline-flex items-center gap-2 bg-[#052e16] border border-[#166534] text-[#86efac] text-sm font-semibold px-4 py-2.5 rounded-md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                You already own this
              </div>
            ) : (
              <AffiliateButton
                productId={runnerUp.productId}
                recommendationId={recommendationId}
                categorySlug={categorySlug}
                label="Shop Now"
               
              />
            )}
          </div>
          <p className="text-[#D1D5DB] text-base leading-relaxed">{runnerUp.whyConsider}</p>
          <p className="text-[#9CA3AF] text-sm">{runnerUp.whyNotTop}</p>
        </div>
      </CollapsibleRow>

      {/* ── UPGRADE OPTION — collapsible ── */}
      {upgradeOption && (
        <CollapsibleRow
          label="Want to Upgrade?"
          accentColor="text-[#FF6B35]"
          headerContent={
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="font-display text-xl text-white leading-tight truncate">
                {upgradeOption.productName.toUpperCase()}
              </span>
              <span className="font-mono text-[#9CA3AF] text-sm shrink-0">
                ${formatPrice(upgradeOption.priceUsd)}*
              </span>
            </div>
          }
        >
          <div className="pt-4 flex flex-col gap-4">
            <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-wide">
              {upgradeOption.keyImprovement}
            </p>
            <p className="text-[#D1D5DB] text-base leading-relaxed">{upgradeOption.whyUpgrade}</p>
            <AffiliateButton
              productId={upgradeOption.productId}
              recommendationId={recommendationId}
              categorySlug={categorySlug}
              label="Shop Now"
             
            />
          </div>
        </CollapsibleRow>
      )}

      {/* ── APPLE ECOSYSTEM NOTE ── */}
      {appleEcosystemNote && !topPick.productName.toLowerCase().includes('apple') && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#D1D5DB] shrink-0">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-[#D1D5DB] text-xs font-semibold uppercase tracking-wide">
              Apple Watch — Considered
            </span>
          </div>
          <p className="text-[#D1D5DB] text-base leading-relaxed">{appleEcosystemNote}</p>
        </div>
      )}

      {/* ── SOURCES ── */}
      {sourcesDrawnFrom.length > 0 && (
        <div className="px-1">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">
            Sources Cited
          </p>
          <div className="flex flex-wrap gap-2">
            {sourcesDrawnFrom.map((source) => {
              const name = typeof source === 'string' ? source : source.name
              const url = typeof source === 'string' ? undefined : source.url
              return url ? (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#0A1628] border border-[#1A3A5C] hover:border-[#FF6B35] text-[#9CA3AF] hover:text-white text-sm px-3 py-1 rounded-full transition-colors"
                >
                  {name}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <span
                  key={name}
                  className="bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-sm px-3 py-1 rounded-full"
                >
                  {name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PROFILE NOTES ── */}
      {profileSpecificWarnings.length > 0 && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3 font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Profile Notes
          </p>
          <ul className="flex flex-col gap-2">
            {profileSpecificWarnings.map((warning) => (
              <li key={warning} className="flex gap-2 items-start">
                <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#FF6B35] block" />
                <p className="text-[#D1D5DB] text-base leading-relaxed">{warning}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── COMPARE ── */}
      {categorySlug && (
        <ComparisonLauncher
          categorySlug={categorySlug}
          categoryName={categorySlug.replace(/-/g, ' ')}
          topPickId={topPick.productId}
          runnerUpId={runnerUp.productId}
          recommendationId={recommendationId}
        />
      )}

      {/* ── FEEDBACK FOOTER ── */}
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
          categoryLabel={categorySlug.replace(/-/g, ' ')}
          isOpen={suggestOpen}
          onClose={() => setSuggestOpen(false)}
        />
      )}
      <ReportCorrectionModal
        productId={topPick.productId}
        productName={topPick.productName}
        recommendationId={recommendationId}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  )
}
