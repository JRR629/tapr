'use client'

import { useEffect, useState } from 'react'

interface Props {
  categorySlug: string
  categoryLabel: string
  isOpen: boolean
  onClose: () => void
}

export function SuggestProductModal({ categorySlug, categoryLabel, isOpen, onClose }: Props) {
  const [brand, setBrand] = useState('')
  const [modelName, setModelName] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBrand('')
      setModelName('')
      setProductUrl('')
      setNotes('')
      setLoading(false)
      setSuccess(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (modelName.trim().length < 2) {
      setError('Model name must be at least 2 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/feedback/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug,
          brand: brand.trim() || undefined,
          modelName: modelName.trim(),
          productUrl: productUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggest-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#22C55E]/15 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#22C55E]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg">Suggestion received. Thank you!</p>
            <p className="text-[#6B7280] text-sm">
              We&apos;ll review your suggestion and add it to our database if it&apos;s a good fit.
            </p>
            <button
              onClick={onClose}
              className="mt-2 border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-4 py-2.5 rounded-md transition-all min-h-[44px] text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2
                id="suggest-modal-title"
                className="font-display text-2xl text-white tracking-wide"
              >
                SUGGEST A PRODUCT
              </h2>
              <p className="text-[#9CA3AF] text-sm mt-1">
                Know a {categoryLabel} that should be in our database? Tell us — we&apos;ll review
                it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Brand */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="suggest-brand" className="text-sm text-[#9CA3AF] font-medium">
                  Brand
                </label>
                <input
                  id="suggest-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Garmin"
                  className="bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)] transition-all text-sm min-h-[44px]"
                />
              </div>

              {/* Model name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="suggest-model" className="text-sm text-[#9CA3AF] font-medium">
                  Model Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="suggest-model"
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. Forerunner 965"
                  required
                  className="bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)] transition-all text-sm min-h-[44px]"
                />
              </div>

              {/* Product URL */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="suggest-url" className="text-sm text-[#9CA3AF] font-medium">
                  Product URL
                </label>
                <input
                  id="suggest-url"
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)] transition-all text-sm min-h-[44px]"
                />
                <p className="text-[#6B7280] text-xs">Link to product page or review</p>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="suggest-notes" className="text-sm text-[#9CA3AF] font-medium">
                  Notes
                </label>
                <textarea
                  id="suggest-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why should we add it?"
                  className="bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)] transition-all text-sm resize-none"
                />
                <p className="text-[#6B7280] text-xs">Why should we add it?</p>
              </div>

              {/* Error */}
              {error && <p className="text-[#EF4444] text-sm">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                >
                  {loading ? 'Submitting…' : 'Submit Suggestion'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-4 py-2.5 rounded-md transition-all min-h-[44px] text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
