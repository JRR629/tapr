'use client'

import { useState } from 'react'
import type { RecommendationResult, Layer2Responses } from '@/types/recommendation'

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

      // Extract server-injected URL map if present
      let jsonAccumulated = accumulated
      const sourceUrlMap: Record<string, string> = {}
      const urlMapMatch = accumulated.match(/\n__SOURCE_URLS__:(\{.+\})$/)
      if (urlMapMatch) {
        try {
          Object.assign(sourceUrlMap, JSON.parse(urlMapMatch[1]) as Record<string, string>)
        } catch { /* ignore */ }
        jsonAccumulated = accumulated.slice(0, accumulated.lastIndexOf('\n__SOURCE_URLS__:'))
      }

      // Parse accumulated JSON
      try {
        const jsonText = jsonAccumulated.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
        const parsed = JSON.parse(jsonText) as RecommendationResult

        // Enrich sourcesDrawnFrom with URLs from our database (authoritative)
        if (Object.keys(sourceUrlMap).length > 0) {
          parsed.sourcesDrawnFrom = parsed.sourcesDrawnFrom.map((s) => {
            const name = typeof s === 'string' ? s : s.name
            const url = sourceUrlMap[name]
            return url ? { name, url } : { name }
          })
        }

        setResult(parsed)
        setIsComplete(true)
        setRecommendationId(pendingRecId)
      } catch {
        throw new Error('Failed to parse recommendation result. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsStreaming(false)
    }
  }

  return { streamedText, result, isStreaming, isComplete, error, recommendationId, getRecommendation }
}
