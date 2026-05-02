'use client'

import { useState } from 'react'

interface RecommendationFeedbackProps {
  recommendationId: string
}

export function RecommendationFeedback({ recommendationId }: RecommendationFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/recommendations/${recommendationId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment || undefined,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return <p className="text-[#22C55E] text-sm">Thanks for your feedback!</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[#D1D5DB] text-sm">How helpful was this recommendation?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating !== null && rating >= star
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} out of 5`}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={filled ? '#FF6B35' : 'none'}
                stroke={filled ? '#FF6B35' : '#1A3A5C'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-150"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )
        })}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional: Tell us more..."
        className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none resize-none"
        rows={3}
      />
      <button
        type="submit"
        disabled={!rating || isLoading}
        className="bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
      >
        {isLoading ? 'Submitting...' : 'Submit Feedback'}
      </button>
      {error && <p className="text-[#EF4444] text-sm">{error}</p>}
    </form>
  )
}
