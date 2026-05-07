'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.status === 409) {
        setStatus('duplicate')
        return
      }

      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Could not connect. Check your connection and try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg px-8 py-6 text-center max-w-md mx-auto">
        <div className="text-[#FF6B35] text-2xl mb-2">✓</div>
        <p className="text-white font-semibold text-lg">You&apos;re on the list.</p>
        <p className="text-[#D1D5DB] text-sm mt-1">We&apos;ll email you the moment Tapr goes live.</p>
      </div>
    )
  }

  if (status === 'duplicate') {
    return (
      <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg px-8 py-6 text-center max-w-md mx-auto">
        <div className="text-[#FF6B35] text-2xl mb-2">✓</div>
        <p className="text-white font-semibold text-lg">You&apos;re already on the list.</p>
        <p className="text-[#D1D5DB] text-sm mt-1">We&apos;ll email <span className="text-[#FF6B35]">{email}</span> the moment Tapr goes live.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        disabled={status === 'loading'}
        className="flex-1 bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-gray-500 rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {status === 'loading' ? 'Sending...' : 'Notify me at launch →'}
      </button>
      {status === 'error' && (
        <p className="text-[#EF4444] text-sm sm:col-span-2 mt-1 text-center w-full">{errorMsg}</p>
      )}
    </form>
  )
}
