import Link from 'next/link'
import { HeaderController } from '@/components/HeaderController'
import { CompactHeader } from '@/components/CompactHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628]">
      <HeaderController><CompactHeader /></HeaderController>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#1A3A5C] py-4 px-6 flex items-center justify-center gap-4 flex-wrap">
        <Link href="/how-it-works" className="text-[#6B7280] hover:text-[#D1D5DB] text-xs transition-colors tracking-wide">
          Methodology
        </Link>
        <span className="text-[#1A3A5C] text-xs">·</span>
        <Link href="/privacy" className="text-[#6B7280] hover:text-[#D1D5DB] text-xs transition-colors tracking-wide">
          Privacy
        </Link>
        <span className="text-[#1A3A5C] text-xs">·</span>
        <Link href="/terms" className="text-[#6B7280] hover:text-[#D1D5DB] text-xs transition-colors tracking-wide">
          Terms
        </Link>
        <span className="text-[#1A3A5C] text-xs">·</span>
        <Link href="/contact" className="text-[#FF6B35] hover:text-[#E55A24] text-xs font-medium transition-colors tracking-wide">
          Contact
        </Link>
      </footer>
    </div>
  )
}
