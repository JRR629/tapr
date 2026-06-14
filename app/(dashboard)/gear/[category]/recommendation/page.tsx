'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRecommendation } from '@/hooks/useRecommendation'
import { RecommendationCard } from '@/components/RecommendationCard'
import { NutritionRecommendationCard } from '@/components/NutritionRecommendationCard'
import { RunningShoeRecommendationCard } from '@/components/RunningShoeRecommendationCard'
import { RecommendationFeedback } from '@/components/RecommendationFeedback'
import { LoadingProgress } from '@/components/LoadingProgress'
import type { Layer2Responses, RecommendationResult, NutritionResult, RunningShoeResult } from '@/types/recommendation'

// ---------------------------------------------------------------------------
// Skeleton that mirrors final card layout
// ---------------------------------------------------------------------------

function _RecommendationSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Top pick skeleton */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
        <div className="h-5 w-20 bg-[#1A3A5C] rounded-full mb-4" />
        <div className="h-10 w-3/4 bg-[#1A3A5C] rounded mb-2" />
        <div className="h-7 w-24 bg-[#1A3A5C] rounded mb-5" />
        <div className="h-11 w-36 bg-[#1A3A5C] rounded-md mb-5" />
        <div className="space-y-2 mb-5">
          <div className="h-4 w-full bg-[#1A3A5C] rounded" />
          <div className="h-4 w-5/6 bg-[#1A3A5C] rounded" />
          <div className="h-4 w-4/6 bg-[#1A3A5C] rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-[#1A3A5C] rounded-full" />
          <div className="h-6 w-24 bg-[#1A3A5C] rounded-full" />
          <div className="h-6 w-16 bg-[#1A3A5C] rounded-full" />
        </div>
      </div>

      {/* Runner up skeleton */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
        <div className="h-5 w-24 bg-[#1A3A5C] rounded-full mb-3" />
        <div className="h-8 w-2/3 bg-[#1A3A5C] rounded mb-2" />
        <div className="h-6 w-20 bg-[#1A3A5C] rounded mb-4" />
        <div className="h-11 w-36 bg-[#1A3A5C] rounded-md mb-4" />
        <div className="h-4 w-full bg-[#1A3A5C] rounded mb-2" />
        <div className="h-4 w-4/5 bg-[#1A3A5C] rounded" />
      </div>

      {/* Sources skeleton */}
      <div>
        <div className="h-3 w-24 bg-[#1A3A5C] rounded mb-2" />
        <div className="flex gap-2">
          <div className="h-6 w-28 bg-[#1A3A5C] rounded-full" />
          <div className="h-6 w-24 bg-[#1A3A5C] rounded-full" />
        </div>
      </div>

      {/* Confidence skeleton */}
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
        <div className="h-3 w-32 bg-[#1A3A5C] rounded mb-3" />
        <div className="flex gap-2 items-center">
          <div className="h-3 w-3 bg-[#1A3A5C] rounded-full" />
          <div className="h-3 w-3 bg-[#1A3A5C] rounded-full" />
          <div className="h-3 w-3 bg-[#1A3A5C] rounded-full" />
          <div className="h-4 w-28 bg-[#1A3A5C] rounded ml-1" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface RecommendationPageProps {
  params: { category: string }
}

export default function RecommendationPage({ params }: RecommendationPageProps) {
  const { category } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const savedId = searchParams.get('id')

  const { streamedText, result, isStreaming, isComplete, error, recommendationId, getRecommendation } = useRecommendation()

  // Saved recommendation state (loaded from DB via ?id=)
  const [savedResult, setSavedResult] = useState<RecommendationResult | null>(null)
  const [savedRecId, setSavedRecId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Guard against React StrictMode double-invoking the fresh-recommendation effect,
  // which would fire two API calls and create duplicate DB rows.
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (savedId) {
      // Load saved recommendation from DB — no Claude call needed
      setLoadingId(true)
      fetch(`/api/recommendations/${savedId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Recommendation not found')
          return res.json() as Promise<{ data: { id: string; recommendation_json: RecommendationResult } }>
        })
        .then(({ data }) => {
          setSavedResult(data.recommendation_json)
          setSavedRecId(data.id)
        })
        .catch((err: Error) => {
          setLoadError(err.message ?? 'Failed to load recommendation')
        })
        .finally(() => setLoadingId(false))
      return
    }

    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    // No saved ID — generate fresh recommendation from sessionStorage
    const layer2Raw = sessionStorage.getItem('trikit_layer2_responses')
    const budgetRaw = sessionStorage.getItem('trikit_budget')

    if (!layer2Raw || !budgetRaw) {
      router.replace(`/gear/${category}/questionnaire`)
      return
    }

    let layer2Responses: Layer2Responses
    let budget: { min: number; max: number }

    try {
      layer2Responses = JSON.parse(layer2Raw) as Layer2Responses
      budget = JSON.parse(budgetRaw) as { min: number; max: number }
    } catch {
      router.replace(`/gear/${category}/questionnaire`)
      return
    }

    void getRecommendation(category, layer2Responses, budget.min, budget.max)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, savedId])

  function handleRetry() {
    hasFetchedRef.current = false
    const layer2Raw = sessionStorage.getItem('trikit_layer2_responses')
    const budgetRaw = sessionStorage.getItem('trikit_budget')
    if (!layer2Raw || !budgetRaw) {
      router.push(`/gear/${category}/questionnaire`)
      return
    }
    try {
      const layer2Responses = JSON.parse(layer2Raw) as Layer2Responses
      const budget = JSON.parse(budgetRaw) as { min: number; max: number }
      void getRecommendation(category, layer2Responses, budget.min, budget.max)
    } catch {
      router.push(`/gear/${category}/questionnaire`)
    }
  }

  // After a fresh stream completes, push ?id= to the URL so revisiting loads from DB
  useEffect(() => {
    if (isComplete && recommendationId && !savedId) {
      router.replace(`/gear/${category}/recommendation?id=${recommendationId}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, recommendationId])

  // Normalize result — guard against missing fields from older Claude outputs
  function normalizeResult(r: RecommendationResult): RecommendationResult {
    return {
      ...r,
      topPick: {
        ...r.topPick,
        keyStrengths: r.topPick?.keyStrengths ?? [],
        keyWeaknesses: r.topPick?.keyWeaknesses ?? [],
      },
      profileSpecificWarnings: r.profileSpecificWarnings ?? [],
      sourcesDrawnFrom: r.sourcesDrawnFrom ?? [],
    }
  }

  // Determine which result to show
  const rawResult = savedResult ?? (isComplete ? result : null)
  const displayResult = rawResult ? normalizeResult(rawResult) : null
  const displayRecId = savedRecId ?? recommendationId ?? undefined
  const isLoading = loadingId || (isStreaming || (!isComplete && !error && !savedId))
  const displayError = loadError ?? (error && !isStreaming ? error : null)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="w-full">
        {/* Heading */}
        <div className="mb-8">
          <Link
            href={`/gear/${category}`}
            className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-4"
          >
            <span>←</span> Back to {category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
          <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-1">
            {category.replace(/-/g, ' ')}
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-white leading-none">
            YOUR RECOMMENDATION
          </h1>
        </div>

        {/* Error state — only show when we have no result to display */}
        {displayError && !isLoading && !displayResult && (
          <div className="bg-[#0F2040] border border-[#EF4444] rounded-lg p-6 text-center">
            <p className="text-[#EF4444] font-semibold mb-1">Something went wrong</p>
            <p className="text-[#D1D5DB] text-sm mb-5">{displayError}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!savedId && (
                <button
                  onClick={handleRetry}
                  className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => router.push(`/gear/${category}`)}
                className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-6 py-3 rounded-md transition-all min-h-[44px]"
              >
                Back to {category.replace(/-/g, ' ')}
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !displayResult && !displayError && (
          <div className="flex flex-col items-center gap-8 py-12">
            <LoadingProgress
              label="BUILDING YOUR RECOMMENDATION"
              messages={category === 'nutrition' ? [
                'Reading your athlete profile…',
                'Analyzing your race duration and conditions…',
                'Reviewing nutrition research and testing data…',
                'Matching products to your GI tolerance…',
                'Building your fueling strategy…',
                'Almost there…',
              ] : category === 'running-shoes' ? [
                'Reading your athlete profile…',
                'Analyzing your foot mechanics and injury history…',
                'Reviewing shoe testing data across sources…',
                'Mapping your mileage and surface needs…',
                'Scoring cushion, stability, and responsiveness fit…',
                'Building your rotation recommendation…',
                'Almost there…',
              ] : [
                'Reading your athlete profile…',
                'Reviewing expert sources…',
                'Analyzing race conditions…',
                'Matching gear to your goals…',
                'Checking budget fit…',
                'Weighing tradeoffs for your profile…',
                'Almost there…',
              ]}
              isComplete={isComplete}
              streamProgress={streamedText.length / 1200}
            />
          </div>
        )}

        {/* Result */}
        {displayResult && category === 'nutrition' ? (
          <NutritionRecommendationCard
            result={displayResult as unknown as NutritionResult}
            recommendationId={displayRecId}
            categorySlug={category}
          />
        ) : displayResult && category === 'running-shoes' ? (
          <RunningShoeRecommendationCard
            result={displayResult as unknown as RunningShoeResult}
            recommendationId={displayRecId}
            categorySlug={category}
          />
        ) : displayResult ? (
          <RecommendationCard
            topPick={displayResult.topPick}
            runnerUp={displayResult.runnerUp}
            upgradeOption={displayResult.upgradeOption}
            profileSpecificWarnings={displayResult.profileSpecificWarnings}
            sourcesDrawnFrom={displayResult.sourcesDrawnFrom}
            confidenceLevel={displayResult.confidenceLevel}
            lowConfidenceReason={displayResult.lowConfidenceReason}
            appleEcosystemNote={displayResult.appleEcosystemNote}
            recommendationId={displayRecId}
            categorySlug={category}
          />
        ) : null}

        {/* Feedback — per CLAUDE.md spec, feedback is prompted 24h after creation via email follow-up, not shown on day-of-creation page */}
        {/* {displayResult && displayRecId && (
          <div className="mt-8 bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6">
            <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-4 font-semibold">
              Rate This Recommendation
            </p>
            <RecommendationFeedback recommendationId={displayRecId} />
          </div>
        )} */}

        {/* Single consolidated disclosure band — replaces per-card / per-button duplicates */}
        {displayResult && (
          <div className="mt-6 px-4 py-3 bg-[#0A1628] border border-[#1A3A5C] rounded-md">
            <p className="text-[#6B7280] text-xs leading-relaxed">
              Prices shown are approximate — verify at retailer. Tapr earns a small commission on purchases through these links. This never influences our recommendations.
            </p>
          </div>
        )}

        {/* Footer nav */}
        {displayResult && (
          <div className="mt-8 pt-6 border-t border-[#1A3A5C] flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/gear/${category}/questionnaire`)}
              className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-5 py-3 rounded-md transition-all min-h-[44px] text-sm"
            >
              Get New Recommendation
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-5 py-3 rounded-md transition-all min-h-[44px] text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
