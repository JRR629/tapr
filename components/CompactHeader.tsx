import Link from 'next/link'
import Image from 'next/image'
import { Settings } from 'lucide-react'
import { AdminNavLink } from '@/components/AdminNavLink'
import CreditBalance from '@/components/CreditBalance'

export function CompactHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A1628]">
      <div className="flex items-center justify-between px-6 md:px-8 h-20 md:h-24">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo-sidebar.svg"
            alt="Tapr"
            width={170}
            height={87}
            priority
            className="hover:opacity-90 transition-opacity w-[140px] md:w-[170px] h-auto"
          />
        </Link>
        <div className="flex items-center gap-3">
          <CreditBalance />
          <AdminNavLink />
          <Link
            href="/settings"
            className="text-[#D1D5DB] hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-[#ffffff08]"
            aria-label="Settings"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
