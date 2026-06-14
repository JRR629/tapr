'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

function UpdatePasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'verifying' | 'ready' | 'submitting' | 'done' | 'error'>('verifying')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const hasVerifiedRef = useRef(false)

  useEffect(() => {
    // React 18 strict mode fires effects twice in dev; recovery tokens are one-time use
    if (hasVerifiedRef.current) return
    hasVerifiedRef.current = true

    async function verifyToken() {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!tokenHash || type !== 'recovery') {
        setError('Invalid or expired reset link.')
        setState('error')
        return
      }

      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })

      if (verifyError) {
        console.error('[update-password] verifyOtp error:', verifyError.message)
        // Safety: clear any session that may have been partially established
        // before the error, so the user can't accidentally be left signed in.
        await supabase.auth.signOut()
        setError('This reset link has expired or is invalid. Please request a new one.')
        setState('error')
        return
      }

      setState('ready')
    }

    verifyToken()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!password || !confirmPassword) {
      setError('Both password fields are required.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setState('submitting')

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      console.error('[update-password] updateUser error:', updateError.message)
      setError('Failed to update password. Please try again.')
      setState('ready')
      setIsLoading(false)
      return
    }

    setState('done')
    // Redirect after brief success message
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  if (state === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center mb-10">
            <Image
              src="/logo-sidebar.svg"
              alt="Tapr"
              width={200}
              height={102}
              priority
            />
          </div>
          <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[#D1D5DB]">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <Image
              src="/logo-sidebar.svg"
              alt="Tapr"
              width={200}
              height={102}
              priority
            />
          </div>

          <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
            <h1 className="font-display text-4xl text-white mb-2 tracking-wide">RESET FAILED</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              {error || 'Something went wrong.'}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/auth/reset"
                className="w-full bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center justify-center"
              >
                Request a new reset link
              </Link>
              <Link
                href="/login"
                className="w-full border border-[#1A3A5C] hover:border-[#FF6B35] text-white font-semibold px-6 py-3 rounded-md transition-colors min-h-[44px] flex items-center justify-center"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex flex-col items-center mb-10">
            <Image
              src="/logo-sidebar.svg"
              alt="Tapr"
              width={200}
              height={102}
              priority
            />
          </div>

          <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
            <h1 className="font-display text-4xl text-white mb-3">PASSWORD UPDATED</h1>
            <p className="text-[#D1D5DB] mb-6">
              Your password has been successfully reset. Taking you to your dashboard...
            </p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // state === 'ready' or 'submitting'
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo-sidebar.svg"
            alt="Tapr"
            width={200}
            height={102}
            priority
          />
        </div>

        <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
          <h1 className="font-display text-4xl text-white mb-2 tracking-wide">NEW PASSWORD</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            Enter a new password for your account.
          </p>

          {error && (
            <div className="bg-[#EF444420] border border-[#EF4444] text-[#EF4444] text-sm rounded-md px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#D1D5DB] text-sm mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#D1D5DB] text-sm mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full bg-[#0A1628] border border-[#1A3A5C] text-white placeholder-[#6B7280] rounded-md px-4 py-3 focus:border-[#FF6B35] focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.15)] transition-all min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A24] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
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

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="flex flex-col items-center mb-10">
              <Image
                src="/logo-sidebar.svg"
                alt="Tapr"
                width={200}
                height={102}
                priority
              />
            </div>
            <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-8">
              <div className="flex justify-center mb-4">
                <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-[#D1D5DB]">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  )
}
