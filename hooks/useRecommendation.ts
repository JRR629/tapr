'use client'

import { useState } from 'react'
import { track } from '@vercel/analytics'
import { parseModelJson } from '@/lib/parseModelJson'
import { notifyCreditsChanged } from '@/lib/creditsEvents'
import type { RecommendationResult, RunningShoeResult, NutritionResult, Layer2Responses } from '@/types/recommendation'

export function useRecommendation() {
  const [streamedText, setStreamedText] = useState('')
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendationId, setRecommendationId] = useState<string | null>(null)

  async function getRecommendation(
    categorySlug: string,
    layer2Responses: Layer2Responses,
    budgetMin: number,
    budgetMax: number
  ): Promise<void> {
    setStreamedText('')
    setResult(null)
    setIsComplete(false)
    setError(null)
    setIsStreaming(true)
    setRecommendationId(null)

    // Pre-generate UUID so the compare launcher has the ID immediately after streaming
    const pendingRecId = crypto.randomUUID()

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recommendation-Id': pendingRecId,
        },
        body: JSON.stringify({ categorySlug, layer2Responses, budgetMin, budgetMax }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to get recommendation'
        try {
          const data = await response.json() as { error?: string }
          if (data.error) errorMessage = data.error
        } catch {
          // ignore parse error
        }
        throw new Error(errorMessage)
      }

      // Request accepted → the credit was deducted server-side. Refresh the
      // balance immediately so every display (header, etc.) reflects it live.
      notifyCreditsChanged()

      if (!response.body) {
        throw new Error('No response body received')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setStreamedText(accumulated)
      }

      // Stream complete — check for server-side error sentinel first
      if (accumulated.startsWith('__STREAM_ERROR__:')) {
        throw new Error(accumulated.replace('__STREAM_ERROR__:', '').trim() || 'Recommendation failed. Please try again.')
      }

      // Extract server-injected sentinels (__SOURCE_URLS__ and __IMAGE_MAP__) if present.
      // Sentinels are appended after the JSON text, each on its own line.
      let jsonAccumulated = accumulated
      const sourceUrlMap: Record<string, string> = {}
      const imageMap: Record<string, string> = {}

      // Strip and parse __SOURCE_URLS__
      // Search from the raw accumulated string, then strip from jsonAccumulated
      const urlMapMatch = accumulated.match(/\n__SOURCE_URLS__:(\{.+\})/)
      if (urlMapMatch) {
        try {
          Object.assign(sourceUrlMap, JSON.parse(urlMapMatch[1]) as Record<string, string>)
        } catch { /* ignore */ }
        const idx = jsonAccumulated.indexOf('\n__SOURCE_URLS__:')
        if (idx !== -1) jsonAccumulated = jsonAccumulated.slice(0, idx)
      }

      // Strip and parse __IMAGE_MAP__ (appended after __SOURCE_URLS__)
      const imageMapMatch = accumulated.match(/\n__IMAGE_MAP__:(\{.+\})/)
      if (imageMapMatch) {
        try {
          Object.assign(imageMap, JSON.parse(imageMapMatch[1]) as Record<string, string>)
        } catch { /* ignore */ }
        const idx = jsonAccumulated.indexOf('\n__IMAGE_MAP__:')
        if (idx !== -1) jsonAccumulated = jsonAccumulated.slice(0, idx)
      }

      // Parse accumulated JSON (robust: handles fences, prose, and malformed
      // JSON via jsonrepair — same helper the server uses).
      try {
        const parsed = parseModelJson<RecommendationResult | RunningShoeResult | NutritionResult>(jsonAccumulated)

        // ── Enrich sourcesDrawnFrom with URLs from our database (authoritative) ──
        if (Object.keys(sourceUrlMap).length > 0 && 'sourcesDrawnFrom' in parsed && Array.isArray(parsed.sourcesDrawnFrom)) {
          parsed.sourcesDrawnFrom = parsed.sourcesDrawnFrom.map((s) => {
            const name = typeof s === 'string' ? s : (s as { name: string }).name
            const url = sourceUrlMap[name]
            return url ? { name, url } : { name }
          })
        }

        // ── Inject imageUrl into each product pick (server-resolved, never from Claude) ──
        if (Object.keys(imageMap).length > 0) {
          const injectImage = <T extends { productId: string; imageUrl?: string | null }>(pick: T | null | undefined): T | null | undefined => {
            if (!pick) return pick
            const url = imageMap[pick.productId]
            return url ? { ...pick, imageUrl: url } : pick
          }

          if ('topPick' in parsed && parsed.topPick) {
            // Generic recommendation result (GPS watches, wetsuits, etc.)
            const generic = parsed as RecommendationResult
            if (generic.topPick)    generic.topPick    = injectImage(generic.topPick)!
            if (generic.runnerUp)   generic.runnerUp   = injectImage(generic.runnerUp)!
            if (generic.upgradeOption) generic.upgradeOption = injectImage(generic.upgradeOption) ?? undefined
          } else if ('primaryPick' in parsed) {
            // Running shoe result
            const shoeResult = parsed as RunningShoeResult
            if (shoeResult.primaryPick)           shoeResult.primaryPick           = injectImage(shoeResult.primaryPick)!
            if (shoeResult.alternatives?.safer)   shoeResult.alternatives.safer    = injectImage(shoeResult.alternatives.safer)!
            if (shoeResult.alternatives?.faster)  shoeResult.alternatives.faster   = injectImage(shoeResult.alternatives.faster)!
            if (shoeResult.alternatives?.value)   shoeResult.alternatives.value    = injectImage(shoeResult.alternatives.value)!
            if (shoeResult.rotationSuggestion?.pairing?.everyday) {
              shoeResult.rotationSuggestion.pairing.everyday = injectImage(shoeResult.rotationSuggestion.pairing.everyday)!
            }
            if (shoeResult.rotationSuggestion?.pairing?.raceDay) {
              shoeResult.rotationSuggestion.pairing.raceDay = injectImage(shoeResult.rotationSuggestion.pairing.raceDay)!
            }
          }
          // Nutrition: skip — nutrition card doesn't use imageUrl
        }

        setResult(parsed as RecommendationResult)
        setIsComplete(true)
        setRecommendationId(pendingRecId)
        track('recommendation_generated', { category: categorySlug })
      } catch {
        throw new Error('Failed to parse recommendation result. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsStreaming(false)
      // Reconcile once settled — catches a background refund on failure.
      // A short delay lets the server's async refund land first.
      setTimeout(notifyCreditsChanged, 1500)
    }
  }

  return { streamedText, result, isStreaming, isComplete, error, recommendationId, getRecommendation }
}
