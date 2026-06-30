'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Settings, Menu, X, Home, GitCompareArrows, ChevronDown } from 'lucide-react'
import SignOutButton from '@/components/auth/SignOutButton'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface TopNavProps {
  userEmail?: string
  firstName?: string
}

const navLinks = [
  { href: '/dashboard', label: 'Recommend', icon: <Home size={15} /> },
  { href: '/compare', label: 'Compare', icon: <GitCompareArrows size={15} /> },
]

export function TopNav({ userEmail, firstName }: TopNavProps) {
  const pathname = usePathname()
  const [accountOpen, setAccountOpen] = useState(false)
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

  useEffect(() => {
    if (!accountOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [accountOpen])

  const initial = (firstName ?? userEmail ?? '?').charAt(0).toUpperCase()

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
      {/* Sticky header: logo strip + nav bar as one unit */}
      <header className="sticky top-0 z-40 w-full bg-[#0F2040] border-b border-[#1A3A5C]">

        {/* Logo strip */}
        <div className="flex items-center justify-between px-6 md:px-8 pt-5 pb-4 border-b border-[#1A3A5C]">
          <Link href="/dashboard" className="block">
            <Image
              src="/logo-sidebar.svg"
              alt="Tapr"
              width={200}
              height={102}
              priority
              className="hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Mobile hamburger — in logo strip so it's always reachable */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Nav bar */}
        <nav className="hidden md:flex items-center h-12 px-6 md:px-8 gap-2">

          {/* Nav links */}
          <div className="flex items-center gap-1 flex-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all min-h-[36px] ${
                    active
                      ? 'text-[#FF6B35] bg-[#FF6B3510]'
                      : 'text-[#6B7280] hover:text-white hover:bg-[#ffffff08]'
                  }`}
                >
                  <span className={active ? 'text-[#FF6B35]' : ''}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Account dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#ffffff08] transition-colors min-h-[36px]"
            >
              <div className="w-6 h-6 rounded-full bg-[#0A1628] border border-[#1A3A5C] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#FF6B35] uppercase leading-none select-none">
                  {initial}
                </span>
              </div>
              {firstName && (
                <span className="text-[#D1D5DB] text-sm">{firstName}</span>
              )}
              <ChevronDown
                size={12}
                className={`text-[#6B7280] transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {accountOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#0F2040] border border-[#1A3A5C] rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                  <Link
                    href="/settings"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#D1D5DB] hover:text-white hover:bg-[#ffffff08] transition-colors"
                  >
                    <Settings size={14} className="flex-shrink-0" />
                    Settings
                  </Link>
                  <div className="border-t border-[#1A3A5C] my-1" />
                  <div className="px-1">
                    <SignOutButton className="w-full px-3 rounded-md text-sm" />
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

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

            {/* Logo in drawer header */}
            <div className="px-6 py-5 border-b border-[#1A3A5C] flex items-center justify-between">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Image
                  src="/logo-sidebar.svg"
                  alt="Tapr"
                  width={160}
                  height={82}
                  className="hover:opacity-90 transition-opacity"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-[#6B7280] hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm min-h-[44px] transition-colors ${
                      active
                        ? 'text-[#FF6B35] bg-[#FF6B3510]'
                        : 'text-[#6B7280] hover:text-white hover:bg-[#ffffff08]'
                    }`}
                  >
                    <span className={active ? 'text-[#FF6B35]' : ''}>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Account section */}
            <div className="px-3 pb-5 border-t border-[#1A3A5C] pt-3 space-y-1">
              {(firstName ?? userEmail) && (
                <div className="flex items-center gap-2.5 px-4 py-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-[#0A1628] border border-[#1A3A5C] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#FF6B35] uppercase leading-none">{initial}</span>
                  </div>
                  <span className="text-[#D1D5DB] text-sm">{firstName ?? userEmail}</span>
                </div>
              )}
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B7280] hover:text-white rounded-md hover:bg-[#ffffff08] min-h-[44px] transition-colors"
              >
                <Settings size={16} className="flex-shrink-0" />
                Settings
              </Link>
              <SignOutButton className="w-full px-4 rounded-md" />
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
