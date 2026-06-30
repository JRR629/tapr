'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, GitCompareArrows, Settings, Menu, X } from 'lucide-react'
import SignOutButton from '@/components/auth/SignOutButton'
import { useFocusTrap } from '@/hooks/useFocusTrap'

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

      <div className="px-3 pt-3 pb-4 border-t border-[#1A3A5C]">

        {/* User identity */}
        {userEmail && (
          <div className="flex items-center gap-2.5 px-4 py-2 mb-0.5">
            <div className="w-6 h-6 rounded-full bg-[#0A1628] border border-[#1A3A5C] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#FF6B35] uppercase leading-none select-none">
                {userEmail.charAt(0)}
              </span>
            </div>
            <span className="text-[#6B7280] text-[11px] truncate leading-none font-medium" title={userEmail}>
              {userEmail}
            </span>
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`group flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-sm min-h-[44px] border-l-2 ${
            pathname.startsWith('/settings') || pathname.startsWith('/profile') || pathname.startsWith('/billing')
              ? 'border-[#FF6B35] text-[#FF6B35] bg-[#FF6B3508] pl-[14px]'
              : 'border-transparent text-[#6B7280] hover:text-white hover:bg-[#ffffff08]'
          }`}
        >
          <Settings size={16} className="flex-shrink-0 transition-transform duration-300 group-hover:rotate-45" />
          <span>Settings</span>
        </Link>

        {/* Sign Out */}
        <SignOutButton className="w-full px-4 rounded-md border-l-2 border-transparent hover:bg-[#EF444408]" />

        {/* Legal micro-links */}
        <div className="flex items-center gap-2 px-4 pt-2">
          <Link href="/how-it-works" onClick={onNavigate} className="text-[#6B7280] hover:text-[#D1D5DB] text-[10px] transition-colors tracking-wide">
            Methodology
          </Link>
          <span className="text-[#1A3A5C] text-[10px]">·</span>
          <Link href="/privacy" onClick={onNavigate} className="text-[#6B7280] hover:text-[#D1D5DB] text-[10px] transition-colors tracking-wide">
            Privacy
          </Link>
          <span className="text-[#1A3A5C] text-[10px]">·</span>
          <Link href="/terms" onClick={onNavigate} className="text-[#6B7280] hover:text-[#D1D5DB] text-[10px] transition-colors tracking-wide">
            Terms
          </Link>
          <span className="text-[#1A3A5C] text-[10px]">·</span>
          <Link href="/contact" onClick={onNavigate} className="text-[#6B7280] hover:text-[#D1D5DB] text-[10px] transition-colors tracking-wide">
            Contact
          </Link>
        </div>
      </div>
    </>
  )
}

export function NavSidebar({ userEmail }: NavSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerRef = useFocusTrap<HTMLElement>(mobileOpen)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

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
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className="relative w-72 bg-[#0F2040] border-r border-[#1A3A5C] h-full flex flex-col outline-none"
          >
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
