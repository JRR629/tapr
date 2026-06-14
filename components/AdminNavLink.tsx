import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard } from 'lucide-react'

export async function AdminNavLink() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.ADMIN_USER_ID) return null

  return (
    <Link
      href="/admin/products"
      className="text-[#F59E0B] hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-[#ffffff08]"
      aria-label="Admin"
      title="Admin"
    >
      <LayoutDashboard size={18} />
    </Link>
  )
}
