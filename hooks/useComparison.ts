'use client'

import { useState } from 'react'
import type { ComparisonResult } from '@/types/comparison'

export function useComparison() {
  const [streamedText, setStreamedText] = useState('')
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comparisonId, setComparisonId] = useState<string | null>(null)

  function reset() {
    setStreamedText('')
    setResult(null)
    setIsStreaming(false)
    setIsComplete(false)
    setError(null)
    setComparisonId(null)
  }

  async function runComparison(
    categorySlug: string,
    productIds: string[],
    externalProducts: string[],
    recommendationId?: string
  ): Promise<void> {
    reset()
    setIsStreaming(true)

    // Pre-generate UUID so the page can update the URL immediately after completion
    const pendingCompId = crypto.randomUUID()

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Comparison-Id': pendingCompId,
        },
        body: JSON.stringify({ categorySlug, productIds, externalProducts, recommendationId }),
      })

      if (!response.ok) {
        let errorCode = 'UNKNOWN'
        let errorMessage = 'Failed to run comparison'
        try {
          const data = await response.json() as { error?: string; code?: string }
          if (data.code) errorCode = data.code
          if (data.error) errorMessage = data.error
        } catch {
          // ignore parse error
        }

        if (errorCode === 'INSUFFICIENT_CREDITS') {
          throw new Error('INSUFFICIENT_CREDITS')
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
        throw new Error(accumulated.replace('__STREAM_ERROR__:', '').trim() || 'Comparison failed. Please try again.')
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
        const parsed = JSON.parse(jsonText) as ComparisonResult

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
        setComparisonId(pendingCompId)
      } catch {
        throw new Error('Failed to parse comparison result. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsStreaming(false)
    }
  }

  return { streamedText, result, isStreaming, isComplete, error, comparisonId, reset, runComparison }
}
