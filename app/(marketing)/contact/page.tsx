'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      const data: unknown = await res.json()

      if (!res.ok) {
        const errData = data as { error?: string }
        setError(errData.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#0A1628]"
      style={{ background: 'radial-gradient(ellipse at top, #0F2040 0%, #0A1628 60%)' }}
    >
      <div className="max-w-xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-10"
        >
          ← Back to Tapr
        </Link>

        <h1 className="font-display text-5xl text-white mb-3">CONTACT US</h1>
        <p className="text-[#D1D5DB] text-base leading-relaxed mb-10">
          Questions, feedback, or just want to say hi — we&apos;d love to hear from you. We typically respond within 1–2 business days.
        </p>

        {success ? (
          <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(34,197,94,0.12)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-3xl text-white mb-2">MESSAGE SENT</h2>
            <p className="text-[#D1D5DB]">We&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#D1D5DB] mb-1.5" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D1D5DB] mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D1D5DB] mb-1.5" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Tell us what's on your mind..."
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-[#EF4444] text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>


          </form>
        )}
      </div>
    </div>
  )
}
