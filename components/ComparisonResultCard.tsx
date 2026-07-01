'use client'

import { useState } from 'react'
import { Info, AlertTriangle, Zap, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { AffiliateButton } from '@/components/AffiliateButton'
import type { ComparisonResult, ComparisonProductAnalysis } from '@/types/comparison'

interface ComparisonResultCardProps {
  result: ComparisonResult
  categorySlug: string
}

// Normalize sourcesDrawnFrom — handles both new {name,url} and old string[] formats
function normalizeSource(s: { name: string; url?: string } | string): { name: string; url?: string } {
  return typeof s === 'string' ? { name: s } : s
}

function FitScoreDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i < score ? 'bg-[#FF6B35]' : 'bg-[#1A3A5C]'}`}
          />
        ))}
      </div>
      <span className="font-mono text-[#FF6B35] text-xs font-semibold">{score}/10</span>
    </div>
  )
}

function ConfidenceBadge({ level, reason }: { level: 'high' | 'medium' | 'low'; reason?: string }) {
  const config = {
    high: { label: 'High Confidence', color: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
    medium: { label: 'Medium Confidence', color: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
    low: { label: 'Low Confidence', color: 'text-[#EF4444]', dot: 'bg-[#EF4444]' },
  }[level] ?? { label: 'Confidence', color: 'text-[#6B7280]', dot: 'bg-[#6B7280]' }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {(['high', 'medium', 'low'] as const).map((l, i) => {
          const filled = level === 'high' ? i <= 2 : level === 'medium' ? i <= 1 : i === 0
          return <span key={l} className={`w-2.5 h-2.5 rounded-full ${filled ? config.dot : 'bg-[#1A3A5C]'}`} />
        })}
        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
      </div>
      {reason && <p className="text-[#9CA3AF] text-sm">{reason}</p>}
    </div>
  )
}

function ExpandedProductDetail({
  product,
  categorySlug,
}: {
  product: ComparisonProductAnalysis
  categorySlug: string
}) {
  return (
    <div className="mt-3 pt-4 border-t border-[#1A3A5C] flex flex-col gap-4">
      {product.isExternal && product.externalDataCaveat && (
        <p className="text-[#9CA3AF] text-sm italic leading-relaxed">{product.externalDataCaveat}</p>
      )}

      <div>
        <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Profile Fit Rationale</p>
        <p className="text-[#D1D5DB] text-base leading-relaxed">{product.profileFitRationale}</p>
      </div>

      {(product.strongSuitsForThisAthlete.length > 0 || product.weakSuitsForThisAthlete.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {product.strongSuitsForThisAthlete.length > 0 && (
            <div>
              <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Strengths for you</p>
              <ul className="flex flex-col gap-1.5">
                {product.strongSuitsForThisAthlete.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="text-[#86efac] font-bold mt-0.5 shrink-0">+</span>
                    <span className="text-[#86efac] text-sm leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {product.weakSuitsForThisAthlete.length > 0 && (
            <div>
              <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Weaknesses for you</p>
              <ul className="flex flex-col gap-1.5">
                {product.weakSuitsForThisAthlete.map((w) => (
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

      <div className="flex flex-col gap-1.5 text-base text-[#D1D5DB] leading-relaxed">
        <p><span className="text-[#22C55E] font-semibold">Best for: </span>{product.bestSituationFor}</p>
        <p><span className="text-[#EF4444] font-semibold">Not ideal: </span>{product.worstSituationFor}</p>
      </div>

      {!product.isExternal && product.productId && (
        <div className="pt-1">
          <AffiliateButton productId={product.productId} categorySlug={categorySlug} label="Shop Now" />
        </div>
      )}
    </div>
  )
}

function RunnerUpRow({
  product,
  categorySlug,
  rank,
  label,
}: {
  product: ComparisonProductAnalysis
  categorySlug: string
  rank: number
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`bg-[#0A1628] border rounded-lg px-5 py-4 transition-all ${open ? 'border-[#1A3A5C]' : 'border-[#1A3A5C]'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 text-left group"
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide">
              {label ?? `#${rank}`}
            </span>
            {product.isExternal && (
              <span className="bg-[#F59E0B15] text-[#F59E0B] border border-[#F59E0B40] text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                AI Knowledge
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-xl text-white leading-tight group-hover:text-[#D1D5DB] transition-colors">
              {product.productName.toUpperCase()}
            </h3>
            {product.priceUsd != null && (
              <span className="font-mono text-[#6B7280] text-sm">${product.priceUsd.toLocaleString()}</span>
            )}
          </div>
          <FitScoreDots score={product.profileFitScore} />
          {!open && (
            <p className="text-[#9CA3AF] text-base leading-relaxed line-clamp-2 mt-0.5">
              {product.profileFitRationale}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[#6B7280] hover:text-white transition-colors shrink-0 mt-1">
          <span className="text-xs font-semibold">{open ? 'Hide' : 'Details'}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && <ExpandedProductDetail product={product} categorySlug={categorySlug} />}
    </div>
  )
}

export function ComparisonResultCard({ result, categorySlug }: ComparisonResultCardProps) {
  // Guard against an incomplete result (e.g. a timed-out or truncated AI
  // response that parsed only partially). Render a clean retry instead of
  // crashing on missing verdict/products/tradeoffs/sources.
  const isComplete =
    !!result?.verdict?.winnerProductName &&
    Array.isArray(result?.products) && result.products.length > 0 &&
    Array.isArray(result?.tradeoffs) &&
    Array.isArray(result?.sourcesDrawnFrom)
  if (!isComplete) {
    return (
      <div className="bg-[#0F2040] border border-[#EF4444] rounded-lg p-6 text-center">
        <p className="text-[#EF4444] font-semibold mb-1">Comparison didn&apos;t finish</p>
        <p className="text-[#9CA3AF] text-sm">The result came back incomplete. Please try again.</p>
      </div>
    )
  }

  const winner = result.products.find(
    (p) =>
      p.productName === result.verdict.winnerProductName ||
      (result.verdict.winnerProductId && p.productId === result.verdict.winnerProductId)
  )
  const runners = result.products.filter((p) => p !== winner)
  const sortedTradeoffs = [...result.tradeoffs].sort(
    (a, b) => (b.mattersForThisAthlete ? 1 : 0) - (a.mattersForThisAthlete ? 1 : 0)
  )

  return (
    <div className="flex flex-col gap-6">

      {/* ── HERO: VERDICT + WINNER ── */}
      <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-6 flex flex-col gap-5">

        {/* Verdict header */}
        <div>
          <span className="bg-[#FF6B3520] text-[#FF6B35] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide inline-block mb-3">
            Verdict
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight mb-3">
            {result.verdict.winnerProductName.toUpperCase()}
          </h2>
          <p className="text-[#D1D5DB] leading-relaxed">{result.verdict.verdictSummary}</p>
        </div>

        {/* Dealbreaker */}
        {result.verdict.dealbreaker && (
          <div className="border-l-2 border-[#EF4444] bg-[#EF444408] rounded-r-md px-4 py-3">
            <p className="text-[#D1D5DB] text-sm">
              <span className="text-[#EF4444] font-semibold">Dealbreaker: </span>
              {result.verdict.dealbreaker}
            </p>
          </div>
        )}

        {/* Winner product details */}
        {winner && (
          <div className="border-t border-[#FF6B3530] pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                {winner.priceUsd != null && (
                  <span className="font-mono text-[#D1D5DB] text-lg">${winner.priceUsd.toLocaleString()}</span>
                )}
                <FitScoreDots score={winner.profileFitScore} />
              </div>
              {winner.isExternal && (
                <span className="bg-[#F59E0B15] text-[#F59E0B] border border-[#F59E0B40] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  AI Knowledge
                </span>
              )}
            </div>

            {(winner.strongSuitsForThisAthlete.length > 0 || winner.weakSuitsForThisAthlete.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {winner.strongSuitsForThisAthlete.length > 0 && (
                  <div>
                    <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Why it wins for you</p>
                    <ul className="flex flex-col gap-1.5">
                      {winner.strongSuitsForThisAthlete.map((s) => (
                        <li key={s} className="flex items-start gap-2">
                          <span className="text-[#86efac] font-bold mt-0.5 shrink-0">+</span>
                          <span className="text-[#86efac] text-sm leading-snug">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {winner.weakSuitsForThisAthlete.length > 0 && (
                  <div>
                    <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">Weaknesses for you</p>
                    <ul className="flex flex-col gap-1.5">
                      {winner.weakSuitsForThisAthlete.map((w) => (
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

            <div className="flex flex-col gap-1.5 text-base text-[#D1D5DB] leading-relaxed">
              <p><span className="text-[#22C55E] font-semibold">Best for: </span>{winner.bestSituationFor}</p>
            </div>

            {winner.isExternal && winner.externalDataCaveat && (
              <p className="text-[#9CA3AF] text-sm italic leading-relaxed">{winner.externalDataCaveat}</p>
            )}

            {!winner.isExternal && winner.productId && (
              <div>
                <AffiliateButton productId={winner.productId} categorySlug={categorySlug} label="Shop Now" />
              </div>
            )}
          </div>
        )}

        {/* Runner-up note + confidence row */}
        <div className="border-t border-[#1A3A5C] pt-4 flex items-start justify-between gap-4 flex-wrap">
          <p className="text-[#9CA3AF] text-base flex-1">
            <span className="text-white font-semibold">Runner-up: </span>
            {result.verdict.runnerUpNote}
          </p>
          <ConfidenceBadge level={result.confidenceLevel} reason={result.lowConfidenceReason} />
        </div>
      </div>

      {/* ── RUNNER-UP / OTHER OPTIONS (accordion) ── */}
      {runners.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold">
            {runners.length === 1 ? 'Runner-Up' : 'Other Options'}
          </p>
          {runners.map((product, i) => (
            <RunnerUpRow
              key={product.productName}
              product={product}
              categorySlug={categorySlug}
              rank={i + 2}
              label={runners.length === 1 ? 'Runner-Up' : undefined}
            />
          ))}
        </div>
      )}

      {/* ── KEY TRADEOFFS ── */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
        <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-5 font-semibold">Key Tradeoffs</p>
        <div className="flex flex-col gap-5">
          {sortedTradeoffs.map((tradeoff) => (
            <div
              key={tradeoff.dimension}
              className="pb-5 border-b border-[#1A3A5C] last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold">{tradeoff.dimension}</span>
                  <span className="text-[#1A3A5C] select-none">·</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[#FF6B35] text-xs font-bold uppercase tracking-wide">Winner</span>
                  <span className="text-white font-bold text-sm leading-tight">{tradeoff.winner}</span>
                </div>
                {!tradeoff.mattersForThisAthlete && (
                  <span className="text-[#9CA3AF] text-xs font-medium px-2.5 py-1 rounded-full border border-[#374151] shrink-0">
                    Less relevant for you
                  </span>
                )}
              </div>
              <p className="text-[#D1D5DB] text-base mb-1">
                <span className="text-[#22C55E]">+</span> {tradeoff.whatYouGain}
              </p>
              <p className="text-[#9CA3AF] text-base mb-1">
                <span className="text-[#EF4444]">–</span> {tradeoff.whatYouLose}
              </p>
              <p className="text-[#9CA3AF] text-sm italic">{tradeoff.athleteRelevanceNote}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CHEAPER OPTION VERDICT ── */}
      {result.cheaperOptionVerdict && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2 font-semibold">
            Is the cheaper option worth it?
          </p>
          <p className="text-[#D1D5DB] text-base leading-relaxed">{result.cheaperOptionVerdict}</p>
        </div>
      )}

      {/* ── SOURCES ── */}
      {result.sourcesDrawnFrom.length > 0 && (
        <div>
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3 font-semibold">Sources Cited</p>
          <div className="flex flex-wrap gap-2">
            {result.sourcesDrawnFrom.map((raw, i) => {
              const source = normalizeSource(raw)
              return source.url ? (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#0A1628] border border-[#1A3A5C] hover:border-[#FF6B35] text-[#D1D5DB] hover:text-white text-sm px-3 py-1.5 rounded-full transition-all group"
                >
                  {source.name}
                  <ExternalLink className="w-3 h-3 text-[#6B7280] group-hover:text-[#FF6B35] transition-colors" />
                </a>
              ) : (
                <span
                  key={i}
                  className="bg-[#0A1628] border border-[#1A3A5C] text-[#9CA3AF] text-sm px-3 py-1.5 rounded-full"
                >
                  {source.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PROFILE NOTES ── */}
      {result.profileSpecificWarnings.length > 0 && (
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
          <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3 font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Profile Notes
          </p>
          <ul className="flex flex-col gap-2">
            {result.profileSpecificWarnings.map((warning, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="text-[#FF6B35] mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#FF6B35] block" />
                <p className="text-[#D1D5DB] text-base leading-relaxed">{warning}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── EXTERNAL PRODUCTS DISCLAIMER ── */}
      {result.hasExternalProducts && (
        <div className="flex items-start gap-3 bg-[#F59E0B08] border border-[#F59E0B30] rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <p className="text-[#D1D5DB] text-sm leading-relaxed">
            One or more products in this comparison were analyzed using Claude&apos;s training knowledge, not our verified review database. External product analysis may not reflect the latest specs or pricing. Verify before purchase.
          </p>
        </div>
      )}
    </div>
  )
}
