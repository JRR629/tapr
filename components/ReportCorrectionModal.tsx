'use client'

import { useEffect, useState } from 'react'

interface Props {
  productId?: string
  productName?: string
  recommendationId?: string
  isOpen: boolean
  onClose: () => void
}

const CORRECTION_OPTIONS = [
  { value: 'price', label: 'Price is incorrect' },
  { value: 'specs', label: 'Specs are wrong' },
  { value: 'availability', label: 'Product unavailable / discontinued' },
  { value: 'recommendation_quality', label: "The recommendation doesn't match my needs" },
  { value: 'other', label: 'Something else' },
] as const

type CorrectionType = (typeof CORRECTION_OPTIONS)[number]['value']

export function ReportCorrectionModal({
  productId,
  productName,
  recommendationId,
  isOpen,
  onClose,
}: Props) {
  const [correctionType, setCorrectionType] = useState<CorrectionType | null>(null)
  const [description, setDescription] = useState('')
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
      setCorrectionType(null)
      setDescription('')
      setLoading(false)
      setSuccess(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!correctionType) {
      setError('Please select what is wrong.')
      return
    }
    if (description.trim().length < 10) {
      setError('Please provide at least 10 characters of detail.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/feedback/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId ?? undefined,
          recommendationId: recommendationId ?? undefined,
          correctionType,
          description: description.trim(),
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
      aria-labelledby="correction-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
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
            <p className="text-white font-semibold text-lg">Issue reported. Our team will review it.</p>
            <p className="text-[#6B7280] text-sm">
              Thank you for helping us improve Tapr&apos;s data quality.
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
                id="correction-modal-title"
                className="font-display text-2xl text-white tracking-wide"
              >
                REPORT AN ISSUE
              </h2>
              <p className="text-[#9CA3AF] text-sm mt-1">
                Help us improve. Flag incorrect data or a recommendation that missed the mark.
              </p>
            </div>

            {productName && (
              <p className="text-[#6B7280] text-sm mb-4">
                Reporting issue with:{' '}
                <span className="text-white font-semibold">{productName}</span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Correction type */}
              <div className="flex flex-col gap-2">
                <p className="text-sm text-[#9CA3AF] font-medium">
                  What&apos;s wrong? <span className="text-[#EF4444]">*</span>
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {CORRECTION_OPTIONS.map((option) => {
                    const isSelected = correctionType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCorrectionType(option.value)}
                        className={`text-left px-4 py-3 rounded-md border transition-all min-h-[44px] text-sm font-medium ${
                          isSelected
                            ? 'border-[#FF6B35] text-white bg-[#FF6B35]/10'
                            : 'border-[#1A3A5C] text-[#9CA3AF] hover:border-[#FF6B35]/50 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="correction-description"
                  className="text-sm text-[#9CA3AF] font-medium"
                >
                  Tell us more <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  id="correction-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,107,53,0.15)] transition-all text-sm resize-none"
                />
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
                  {loading ? 'Submitting…' : 'Submit Report'}
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
