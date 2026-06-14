import Link from 'next/link'
import { User, CreditCard } from 'lucide-react'
import SignOutButton from '@/components/auth/SignOutButton'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[#6B7280] hover:text-white text-sm transition-colors mb-6"
      >
        <span>←</span> Back to Dashboard
      </Link>
      <h1 className="font-display text-5xl text-white mb-2">SETTINGS</h1>
      <p className="text-[#6B7280] text-base mb-10">Manage your profile, preferences, and billing.</p>

      <div className="flex flex-col gap-3">
        <Link
          href="/profile"
          className="group bg-[#0F2040] border border-[#1A3A5C] hover:border-[#FF6B35] rounded-lg p-6 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 duration-200"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FF6B3520] flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-white font-semibold group-hover:text-[#FF6B35] transition-colors">My Profile</p>
            <p className="text-[#6B7280] text-sm">Event types, body stats, fit issues, and gear preferences.</p>
          </div>
        </Link>

        <Link
          href="/billing"
          className="group bg-[#0F2040] border border-[#1A3A5C] hover:border-[#FF6B35] rounded-lg p-6 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 duration-200"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FF6B3520] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-white font-semibold group-hover:text-[#FF6B35] transition-colors">Billing</p>
            <p className="text-[#6B7280] text-sm">Manage your subscription, payment method, and invoices.</p>
          </div>
        </Link>
      </div>

      <div className="mt-2 border-t border-[#1A3A5C] pt-4">
        <div className="px-2">
          <SignOutButton className="w-full px-4 rounded-md text-sm border border-[#1A3A5C] hover:border-[#EF4444] text-[#6B7280] hover:text-[#EF4444] transition-colors" />
        </div>
      </div>

      <footer className="text-center text-[#6B7280] text-xs py-6 border-t border-[#1A3A5C] mt-12">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </footer>
    </div>
  )
}
