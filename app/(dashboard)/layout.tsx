import { createClient } from '@/lib/supabase/server'
import { NavSidebar } from '@/components/NavSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen bg-[#0A1628]">
      <NavSidebar userEmail={user?.email} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
