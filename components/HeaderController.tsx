'use client'

import { usePathname } from 'next/navigation'
import { CompactHeader } from './CompactHeader'

export function HeaderController() {
  const pathname = usePathname()
  if (pathname === '/dashboard') return null
  return <CompactHeader />
}
