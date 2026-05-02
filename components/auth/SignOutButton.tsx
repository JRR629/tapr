'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SignOutButtonProps {
  className?: string
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className={`min-h-[44px] text-[#6B7280] hover:text-[#FF6B35] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
