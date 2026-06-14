'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
      className={`flex items-center gap-3 min-h-[44px] text-[#6B7280] hover:text-[#EF4444] transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      <LogOut size={16} className="flex-shrink-0" />
      <span>{isLoading ? 'Signing out…' : 'Sign Out'}</span>
    </button>
  )
}
