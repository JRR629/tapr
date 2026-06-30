'use client'

import { usePathname } from 'next/navigation'

export function HeaderController({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/dashboard') return null
  return <>{children}</>
}
