'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, GitCompareArrows, Settings, Menu, X } from 'lucide-react'
import SignOutButton from '@/components/auth/SignOutButton'

interface NavSidebarProps {
  userEmail?: string
}

const navLinks = [
  { href: '/dashboard', label: 'Recommend', icon: <Home size={18} /> },
  { href: '/compare', label: 'Compare', icon: <GitCompareArrows size={18} /> },
]

function NavContent({ pathname, onNavigate, userEmail }: { pathname: string; onNavigate?: () => void; userEmail?: string }) {
  function isActive(href: string): boolean {
    if (href === '/dashboard') {
      return (pathname === '/dashboard' || pathname.startsWith('/gear')) && !pathname.endsWith('/compare')
    }
    if (href === '/compare') {
      return pathname === '/compare' || pathname.endsWith('/compare')
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-md transition-all text-sm min-h-[44px]
                ${active
                  ? 'border-l-2 border-[#FF6B35] text-[#FF6B35] bg-[#FF6B3508] pl-[14px]'
                  : 'text-[#6B7280] hover:text-white hover:bg-[#ffffff08] border-l-2 border-transparent'
                }
              `}
            >
              <span className={active ? 'text-[#FF6B35]' : ''}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="px-4 py-4 border-t border-[#1A3A5C] space-y-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm min-h-[44px] ${
            pathname.startsWith('/settings') || pathname.startsWith('/profile') || pathname.startsWith('/billing')
              ? 'text-[#FF6B35]'
              : 'text-[#6B7280] hover:text-white hover:bg-[#ffffff08]'
          }`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        {userEmail && (
          <p className="text-[#6B7280] text-xs truncate px-1" title={userEmail}>
            {userEmail}
          </p>
        )}
        <SignOutButton className="w-full text-left" />
      </div>
    </>
  )
}

export function NavSidebar({ userEmail }: NavSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-64 bg-[#0F2040] border-r border-[#1A3A5C] h-screen sticky top-0 flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-[#1A3A5C]">
          <Link href="/dashboard" className="block">
            <Image
              src="/logo-sidebar.svg"
              alt="Tapr"
              width={208}
              height={106}
              priority
              className="hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>
        <NavContent pathname={pathname} userEmail={userEmail} />
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F2040] border-b border-[#1A3A5C] flex items-center justify-between px-4 h-14">
        <Link href="/dashboard">
          <span className="font-display text-2xl text-[#FF6B35] tracking-wider">TAPR</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <nav className="relative w-72 bg-[#0F2040] border-r border-[#1A3A5C] h-full flex flex-col">
            <div className="px-6 py-4 border-b border-[#1A3A5C] flex items-center justify-between">
              <span className="font-display text-2xl text-[#FF6B35] tracking-wider">TAPR</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-[#6B7280] hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
            <NavContent pathname={pathname} onNavigate={() => setMobileOpen(false)} userEmail={userEmail} />
          </nav>
        </div>
      )}
    </>
  )
}
