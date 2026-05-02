'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    setSent(true)
    setIsLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-4xl text-white mb-3">CHECK YOUR EMAIL</h1>
          <p className="text-[#D1D5DB] mb-6">
            We sent a reset link to <span className="text-[#FF6B35]">{email}</span>
          </p>
          <Link href="/login" className="text-[#FF6B35] hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-display text-4xl text-[#FF6B35] tracking-wider">TRIKIT AI</span>
        </div>

        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
          <h1 className="font-display text-4xl text-white mb-2 tracking-wide">RESET PASSWORD</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="bg-[#EF444420] border border-[#EF4444] text-[#EF4444] text-sm rounded-md px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#D1D5DB] text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            <Link href="/login" className="text-[#FF6B35] hover:underline font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
