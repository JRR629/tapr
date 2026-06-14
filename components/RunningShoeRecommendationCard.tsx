'use client'

import { useState } from 'react'
import { Info, ExternalLink, GitCompareArrows, Flag, PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AffiliateButton } from '@/components/AffiliateButton'
import { ReportCorrectionModal } from '@/components/ReportCorrectionModal'
import { SuggestProductModal } from '@/components/SuggestProductModal'
import type {
  RunningShoeResult,
  ShoePrimaryPick,
  ShoeAlternativeItem,
  ShoeRotationSuggestion,
  PurposeFitLabel,
} from '@/types/recommendation'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RunningShoeRecommendationCardProps {
  result: RunningShoeResult
  recommendationId?: string
  categorySlug?: string
}

// ─── Confidence indicator (shared pattern with other cards) ───────────────────

function ConfidenceIndicator({
  level,
  reason,
}: {
  level: 'high' | 'medium' | 'low'
  reason?: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const config = {
    high:   { label: 'High Confidence',   color: 'text-[#22C55E]', dotColor: 'bg-[#22C55E]' },
    medium: { label: 'Medium Confidence', color: 'text-[#F59E0B]', dotColor: 'bg-[#F59E0B]' },
    low:    { label: 'Low Confidence',    color: 'text-[#EF4444]', dotColor: 'bg-[#EF4444]' },
  }[level]

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {(['high', 'medium', 'low'] as const).map((l, i) => {
            const filled =
              level === 'high' ? i <= 2 : level === 'medium' ? i <= 1 : i === 0
            return (
              <span
                key={l}
                className={`w-2 h-2 rounded-full ${filled ? config.dotColor : 'bg-[#1A3A5C]'}`}
              />
            )
          })}
        </div>
        <span className={`text-xs font-semibold ${config.color}`}>
          {config.label}
        </span>
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
          <p className="mb-1.5">
            <span className="text-[#22C55E] font-semibold">High</span> — strong consensus across independent expert reviews of this product.
          </p>
          <p className="mb-1.5">
            <span className="text-[#F59E0B] font-semibold">Medium</span> — partial or limited review coverage; recommendation is solid but the data set is thinner.
          </p>
          <p className="mb-1.5">
            <span className="text-[#EF4444] font-semibold">Low</span> — significant gaps in available data; treat this as a best-effort suggestion.
          </p>
          {reason && (
            <p className="mt-2 pt-2 border-t border-[#1A3A5C] text-[#D1D5DB]">
              <span className="text-white font-semibold">For this pick: </span>
              {reason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Purpose Fit Matrix ───────────────────────────────────────────────────────

/**
 * Renders the 5-row purpose matrix using pure CSS — no emojis, no bitmaps.
 *
 * Dot fill logic:
 *   excellent  → 5 dots, orange (#FF6B35)
 *   good       → 4 dots, orange at 70% opacity
 *   acceptable → 3 dots, gray (#6B7280)
 *   avoid      → 2 dots, dim (#2A4060)
 *   unknown    → 0 dots shown, replaced with em-dash
 *
 * Label (small-caps via font-variant) appears after the dots in muted text.
 */

const PURPOSE_LABELS: Record<string, string> = {
  daily_training: 'Daily Training',
  tempo:          'Tempo',
  long_runs:      'Long Runs',
  racing:         'Racing',
  recovery:       'Recovery',
}

const PURPOSE_ORDER = ['daily_training', 'tempo', 'long_runs', 'racing', 'recovery'] as const

function purposeDotConfig(label: PurposeFitLabel): {
  filled: number
  dotClass: string
  valueLabel: string
  valueLabelClass: string
} {
  switch (label) {
    case 'excellent':
      return {
        filled: 5,
        dotClass: 'bg-[#FF6B35]',
        valueLabel: 'excellent',
        valueLabelClass: 'text-[#FF6B35]',
      }
    case 'good':
      return {
        filled: 4,
        dotClass: 'bg-[#FF6B35]/70',
        valueLabel: 'good',
        valueLabelClass: 'text-[#FF6B35]/70',
      }
    case 'acceptable':
      return {
        filled: 3,
        dotClass: 'bg-[#6B7280]',
        valueLabel: 'acceptable',
        valueLabelClass: 'text-[#6B7280]',
      }
    case 'avoid':
      return {
        filled: 2,
        dotClass: 'bg-[#2A4060]',
        valueLabel: 'avoid',
        valueLabelClass: 'text-[#3A5070]',
      }
    default:
      return {
        filled: 0,
        dotClass: 'bg-[#1A3A5C]',
        valueLabel: '—',
        valueLabelClass: 'text-[#4B6480]',
      }
  }
}

function PurposeFitMatrixRow({
  purposeKey,
  label,
}: {
  purposeKey: PurposeFitLabel
  label: string
}) {
  const { filled, dotClass, valueLabel, valueLabelClass } = purposeDotConfig(purposeKey)

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Row label */}
      <span className="text-[#9CA3AF] text-xs w-28 shrink-0 font-medium">{label}</span>

      {/* Dot track — always 5 slots */}
      <div className="flex items-center gap-1" aria-label={`${label}: ${valueLabel}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < filled ? dotClass : 'bg-[#1A3A5C]'
            }`}
          />
        ))}
      </div>

      {/* Value label — small caps via tracking + uppercase + small size */}
      <span
        className={`text-[10px] font-semibold uppercase tracking-widest ${valueLabelClass}`}
        style={{ fontVariant: 'small-caps' }}
      >
        {valueLabel}
      </span>
    </div>
  )
}

function PurposeFitMatrixBlock({
  matrix,
  verdict,
}: {
  matrix: RunningShoeResult['primaryPick']['purposeFitMatrix']
  verdict: string
}) {
  return (
    <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-lg px-5 py-4">
      <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-3">
        Purpose Fit
      </p>
      <div className="divide-y divide-[#1A3A5C]/50">
        {PURPOSE_ORDER.map((key) => (
          <PurposeFitMatrixRow
            key={key}
            purposeKey={matrix[key]}
            label={PURPOSE_LABELS[key]}
          />
        ))}
      </div>
      {verdict && (
        <p className="mt-3 pt-3 border-t border-[#1A3A5C] text-[#9CA3AF] text-xs italic leading-relaxed">
          {verdict}
        </p>
      )}
    </div>
  )
}


// ─── Previous gen badge ───────────────────────────────────────────────────────

function PrevGenBadge() {
  return (
    <span className="inline-flex items-center bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full">
      Previous gen
    </span>
  )
}

// ─── Profile warnings ─────────────────────────────────────────────────────────

function ProfileWarnings({ warnings }: { warnings: string[] }) {
  if (!warnings || warnings.length === 0) return null
  return (
    <div className="bg-[#0F2040] border border-[#F59E0B]/40 rounded-lg p-4">
      <p className="text-[#F59E0B] text-xs uppercase tracking-wide font-semibold flex items-center gap-1.5 mb-3">
        <Info className="w-3.5 h-3.5" />
        Profile Notes
      </p>
      <ul className="flex flex-col gap-2">
        {warnings.map((w, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#F59E0B] block" />
            <p className="text-[#D1D5DB] text-sm leading-relaxed">{w}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Sources section ──────────────────────────────────────────────────────────

function SourcesSection({
  sources,
}: {
  sources: Array<{ name: string; url?: string | null }>
}) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="px-1">
      <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">
        Sources Cited
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) =>
          source.url ? (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#0A1628] border border-[#1A3A5C] hover:border-[#FF6B35] text-[#9CA3AF] hover:text-white text-xs px-3 py-1 rounded-full transition-colors min-h-[32px]"
            >
              {source.name}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          ) : (
            <span
              key={source.name}
              className="bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-xs px-3 py-1 rounded-full min-h-[32px] flex items-center"
            >
              {source.name}
            </span>
          )
        )}
      </div>
    </div>
  )
}

// ─── Alternative tile ─────────────────────────────────────────────────────────

const ALTERNATIVE_ROLE_LABELS: Record<string, string> = {
  safer:  'Safer choice',
  faster: 'Faster option',
  value:  'Best value',
}

const ALTERNATIVE_ROLE_COLORS: Record<string, string> = {
  safer:  'text-[#60A5FA]',  // blue — safety/stability
  faster: 'text-[#FF6B35]',  // orange — speed/urgency
  value:  'text-[#22C55E]',  // green — value/money
}

const ALTERNATIVE_BORDER_COLORS: Record<string, string> = {
  safer:  'border-[#60A5FA]/20 hover:border-[#60A5FA]/60',
  faster: 'border-[#FF6B35]/20 hover:border-[#FF6B35]/60',
  value:  'border-[#22C55E]/20 hover:border-[#22C55E]/60',
}

function AlternativeTile({
  role,
  alt,
  recommendationId,
  categorySlug,
}: {
  role: 'safer' | 'faster' | 'value'
  alt: ShoeAlternativeItem
  recommendationId?: string
  categorySlug?: string
}) {
  const roleLabel    = ALTERNATIVE_ROLE_LABELS[role]
  const roleColor    = ALTERNATIVE_ROLE_COLORS[role]
  const borderColor  = ALTERNATIVE_BORDER_COLORS[role]

  return (
    <div
      className={`bg-[#0F2040] border rounded-lg p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 ${borderColor}`}
    >
      {/* Role label + prev-gen badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-xs font-semibold uppercase tracking-widest ${roleColor}`}>
          {roleLabel}
        </span>
        {alt.isPreviousGen && <PrevGenBadge />}
      </div>

      {/* Name + price */}
      <div>
        <h3 className="font-display text-2xl text-white leading-tight">
          {alt.productName.toUpperCase()}
        </h3>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="font-mono text-[#9CA3AF] text-base">
            ${alt.priceUsd.toLocaleString()}
          </p>
          <span className="text-[#4B5563] text-xs">approx.</span>
        </div>
      </div>

      {/* Differentiator chip */}
      {alt.differentiator && (
        <span className="inline-block self-start bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-xs px-2.5 py-1 rounded-full leading-none">
          {alt.differentiator}
        </span>
      )}

      {/* Why consider */}
      <p className="text-[#D1D5DB] text-sm leading-relaxed">{alt.whyConsider}</p>

      {/* Affiliate */}
      <div className="mt-auto pt-1">
        <AffiliateButton
          productId={alt.productId}
          recommendationId={recommendationId}
          categorySlug={categorySlug}
          label="Shop Now"
        />
      </div>

      {/* Price caveat moved to consolidated band on recommendation page */}
    </div>
  )
}

// ─── Rotation suggestion ──────────────────────────────────────────────────────

function RotationSection({
  rotation,
  recommendationId,
  categorySlug,
}: {
  rotation: ShoeRotationSuggestion
  recommendationId?: string
  categorySlug?: string
}) {
  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5 flex flex-col gap-4">
      <div>
        <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-1">
          Building a rotation?
        </p>
        <p className="text-[#D1D5DB] text-sm leading-relaxed">{rotation.rationale}</p>
        {rotation.estimatedAnnualCostDelta > 0 && (
          <p className="text-[#9CA3AF] text-xs mt-2 font-mono">
            Estimated annual cost delta:{' '}
            <span className="text-[#F59E0B]">
              +${rotation.estimatedAnnualCostDelta.toLocaleString()}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Everyday shoe */}
        <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-lg p-4 flex flex-col gap-2">
          <p className="text-[#6B7280] text-[10px] uppercase tracking-widest font-semibold">
            Everyday
          </p>
          <h4 className="font-display text-xl text-white leading-tight">
            {rotation.pairing.everyday.productName.toUpperCase()}
          </h4>
          <p className="text-[#9CA3AF] text-xs leading-relaxed">
            {rotation.pairing.everyday.whenToUse}
          </p>
          <div className="mt-auto pt-2">
            <AffiliateButton
              productId={rotation.pairing.everyday.productId}
              recommendationId={recommendationId}
              categorySlug={categorySlug}
              label="Shop Now"
            />
          </div>
        </div>

        {/* Race-day shoe */}
        <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-lg p-4 flex flex-col gap-2">
          <p className="text-[#FF6B35] text-[10px] uppercase tracking-widest font-semibold">
            Race Day
          </p>
          <h4 className="font-display text-xl text-white leading-tight">
            {rotation.pairing.raceDay.productName.toUpperCase()}
          </h4>
          <p className="text-[#9CA3AF] text-xs leading-relaxed">
            {rotation.pairing.raceDay.whenToUse}
          </p>
          <div className="mt-auto pt-2">
            <AffiliateButton
              productId={rotation.pairing.raceDay.productId}
              recommendationId={recommendationId}
              categorySlug={categorySlug}
              label="Shop Now"
            />
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Primary pick ─────────────────────────────────────────────────────────────

function PrimaryPickSection({
  pick,
  confidenceLevel,
  lowConfidenceReason,
  recommendationId,
  categorySlug,
}: {
  pick: ShoePrimaryPick
  confidenceLevel: 'high' | 'medium' | 'low'
  lowConfidenceReason?: string | null
  recommendationId?: string
  categorySlug?: string
}) {
  return (
    <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-6 flex flex-col gap-5">

      {/* Header row: badge + confidence */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="bg-[#FF6B3520] text-[#FF6B35] text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
          Top Pick
        </span>
        <ConfidenceIndicator level={confidenceLevel} reason={lowConfidenceReason} />
      </div>

      {/* Prev-gen badge */}
      {pick.isPreviousGen && (
        <div>
          <PrevGenBadge />
        </div>
      )}

      {/* Product name */}
      <h2 className="font-display text-4xl sm:text-5xl text-white leading-none break-words">
        {pick.productName.toUpperCase()}
      </h2>

      {/* Price */}
      <div>
        <p className="font-mono text-[#FF6B35] text-2xl">${pick.priceUsd.toLocaleString()}</p>
      </div>

      {/* Affiliate CTA */}
      <AffiliateButton
        productId={pick.productId}
        recommendationId={recommendationId}
        categorySlug={categorySlug}
        label="Shop Now"
      />

      {/* Personalized reason */}
      <p className="text-[#D1D5DB] leading-relaxed">{pick.personalizedReason}</p>

      {/* Key strengths + tradeoffs */}
      {(pick.keyStrengths.length > 0 || pick.tradeoffs.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pick.keyStrengths.length > 0 && (
            <div>
              <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-2">
                Strengths for you
              </p>
              <ul className="flex flex-col gap-1.5">
                {pick.keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#86efac] font-bold mt-0.5 shrink-0">+</span>
                    <span className="text-[#86efac] text-sm leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pick.tradeoffs.length > 0 && (
            <div>
              <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-2">
                What to be aware of
              </p>
              <ul className="flex flex-col gap-1.5">
                {pick.tradeoffs.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#fca5a5] font-bold mt-0.5 shrink-0">−</span>
                    <span className="text-[#fca5a5] text-sm leading-snug">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* One honest caveat */}
      {pick.oneHonestCaveat && (
        <div className="border-l-2 border-[#FF6B35] bg-[#FF6B3508] rounded-r-md px-4 py-3">
          <p className="text-[#D1D5DB] text-sm italic">
            <span className="not-italic text-[#FF6B35] font-semibold">One thing to know: </span>
            {pick.oneHonestCaveat}
          </p>
        </div>
      )}

      {/* Race legality note — only when present */}
      {pick.raceLegalityNote && (
        <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-md px-4 py-3 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#60A5FA] shrink-0 mt-0.5" />
          <p className="text-[#D1D5DB] text-xs leading-relaxed">{pick.raceLegalityNote}</p>
        </div>
      )}

      {/* Purpose fit matrix */}
      <PurposeFitMatrixBlock
        matrix={pick.purposeFitMatrix}
        verdict={pick.versatilityVerdict}
      />
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export function RunningShoeRecommendationCard({
  result,
  recommendationId,
  categorySlug,
}: RunningShoeRecommendationCardProps) {
  const { primaryPick, alternatives, rotationSuggestion, profileSpecificWarnings, sourcesDrawnFrom, confidenceLevel, lowConfidenceReason } = result
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  function handleQuickCompare() {
    if (!recommendationId || !primaryPick.productId) return
    const slug = categorySlug ?? 'running-shoes'
    router.push(
      `/gear/${slug}/compare?products=${primaryPick.productId}&rec=${recommendationId}&quickcompare=1`
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Primary pick — lead with the recommendation. Warnings move below
          so they support, not eclipse, the actual answer. */}
      <PrimaryPickSection
        pick={primaryPick}
        confidenceLevel={confidenceLevel}
        lowConfidenceReason={lowConfidenceReason}
        recommendationId={recommendationId}
        categorySlug={categorySlug}
      />

      {/* Profile-specific notes — moved below primary pick (2026-06-07).
          Was at the very top but contained AI jargon that obscured the
          recommendation. Now positioned as supporting context that the user
          encounters AFTER seeing the actual answer. */}
      <ProfileWarnings warnings={profileSpecificWarnings} />

      {/* Alternatives: safer / faster / value — 3-column on md+, stacked on mobile */}
      <div>
        <p className="font-display text-2xl text-white mb-3">ALTERNATIVES</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['safer', 'faster', 'value'] as const).map((role) => {
            const alt = alternatives[role]
            if (alt === null) {
              return (
                <div key={role} className="bg-[#0F2040] border border-[#1A3A5C]/40 rounded-lg p-4 flex flex-col gap-2 opacity-50">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">
                    Faster option
                  </span>
                  <p className="text-sm text-[#6B7280]">
                    No faster option recommended — the speed trade-off isn&apos;t appropriate for your current profile or constraints.
                  </p>
                </div>
              )
            }
            return (
              <AlternativeTile
                key={role}
                role={role}
                alt={alt}
                recommendationId={recommendationId}
                categorySlug={categorySlug}
              />
            )
          })}
        </div>
      </div>

      {/* Rotation suggestion — only when non-null */}
      {rotationSuggestion && (
        <RotationSection
          rotation={rotationSuggestion}
          recommendationId={recommendationId}
          categorySlug={categorySlug}
        />
      )}

      {/* Sources */}
      <SourcesSection sources={sourcesDrawnFrom} />

      {/* Footer actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#1A3A5C] flex-wrap">
        <button
          type="button"
          onClick={handleQuickCompare}
          disabled={!recommendationId}
          className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] text-sm"
        >
          <GitCompareArrows className="w-4 h-4" />
          Compare with a shoe I had in mind
        </button>
        <div className="flex items-center gap-1 ml-auto">
          {categorySlug && (
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#9CA3AF] text-sm transition-colors min-h-[44px] px-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Suggest a shoe
            </button>
          )}
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#9CA3AF] text-sm transition-colors min-h-[44px] px-2"
          >
            <Flag className="w-3.5 h-3.5" />
            Report an issue
          </button>
        </div>
      </div>

      {categorySlug && (
        <SuggestProductModal
          categorySlug={categorySlug}
          categoryLabel="running shoes"
          isOpen={suggestOpen}
          onClose={() => setSuggestOpen(false)}
        />
      )}
      <ReportCorrectionModal
        productId={primaryPick.productId}
        productName={primaryPick.productName}
        recommendationId={recommendationId}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  )
}
