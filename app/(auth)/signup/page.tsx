'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [verifyEmailSent, setVerifyEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    // Supabase sends a confirmation email by default
    // Check if auto-confirm is enabled in Supabase — if so, redirect straight to onboarding
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Auto-confirm is on — go straight to onboarding
      router.push('/onboarding')
      router.refresh()
    } else {
      // Email confirmation required
      setVerifyEmailSent(true)
      setIsLoading(false)
    }
  }

  if (verifyEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full border-2 border-[#FF6B35] flex items-center justify-center"
              style={{ animation: 'tapr-blink 2s ease-in-out infinite' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
          </div>
          <h1 className="font-display text-4xl text-white mb-3">CHECK YOUR EMAIL</h1>
          <p className="text-[#D1D5DB] mb-2">
            We sent a confirmation link to <span className="text-[#FF6B35]">{email}</span>
          </p>
          <p className="text-[#6B7280] text-sm">
            Click the link in the email to activate your account and start building your athlete profile.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block text-[#FF6B35] hover:underline text-sm"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo-sidebar.svg"
            alt="Tapr"
            width={200}
            height={102}
            priority
          />
          <p className="text-[#6B7280] text-sm mt-3">Stop Guessing. Start Racing.</p>
        </div>

        {/* Card */}
        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
          <h1 className="font-display text-4xl text-white mb-2 tracking-wide">CREATE ACCOUNT</h1>
          <p className="text-[#6B7280] text-sm mb-6">Free to start. 3 recommendations per day.</p>

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

            <div>
              <label className="block text-[#D1D5DB] text-sm mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                autoComplete="new-password"
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-[#D1D5DB] text-sm mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px]"
              />
            </div>

            {/* Affiliate disclosure — required at signup per business rules */}
            <p className="text-[#6B7280] text-xs leading-relaxed pt-1">
              Tapr is free to use. We earn affiliate commissions when you buy gear through our links. Our AI recommendations are never influenced by commission rates.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] mt-2"
            >
              {isLoading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FF6B35] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
