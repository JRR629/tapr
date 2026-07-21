import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminNav } from '@/components/AdminNav'

export const dynamic = 'force-dynamic'

// Admin user dashboard — the answer to "how do I know when I get a new user?".
// There is no per-signup alert by design (too noisy); this page is the deliberate
// place to check growth. Source of truth for the user list is Supabase Auth
// (auth.users), enriched with onboarding / activity / credit data from public tables.

interface UserRow {
  id: string
  email: string
  createdAt: string
  lastSignInAt: string | null
  confirmed: boolean
  onboarded: boolean
  recCount: number
  credits: number | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never'
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const day = 24 * 60 * 60 * 1000
  if (diffMs < day) return 'Today'
  if (diffMs < 2 * day) return 'Yesterday'
  const days = Math.floor(diffMs / day)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-5">
      <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-2">{label}</p>
      <p className={`font-mono text-3xl font-semibold ${accent ? 'text-[#FF6B35]' : 'text-white'}`}>{value}</p>
    </div>
  )
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect('/dashboard')
  }

  const adminClient = createAdminClient()

  // 1. Pull every auth user (paginated — listUsers caps at 1000/page).
  interface AuthUserLite { id: string; email?: string; created_at?: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null }
  const authUsers: AuthUserLite[] = []
  try {
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) break
      const batch = data?.users ?? []
      authUsers.push(...(batch as unknown as AuthUserLite[]))
      if (batch.length < 1000) break
    }
  } catch { /* degrade to whatever we collected */ }

  // 2. Enrich from public tables (independent queries → parallel).
  const [profilesRes, recsRes, creditsRes] = await Promise.all([
    adminClient.from('athlete_profiles').select('user_id'),
    adminClient.from('gear_recommendations').select('user_id'),
    adminClient.from('user_credits').select('user_id, credits_remaining'),
  ])

  const onboardedIds = new Set<string>((profilesRes.data ?? []).map((r: { user_id: string }) => r.user_id))
  const recCounts = new Map<string, number>()
  for (const r of (recsRes.data ?? []) as { user_id: string }[]) {
    recCounts.set(r.user_id, (recCounts.get(r.user_id) ?? 0) + 1)
  }
  const creditsMap = new Map<string, number>()
  for (const c of (creditsRes.data ?? []) as { user_id: string; credits_remaining: number }[]) {
    creditsMap.set(c.user_id, c.credits_remaining)
  }

  const rows: UserRow[] = authUsers
    .filter((u) => u.created_at)
    .map((u) => ({
      id: u.id,
      email: u.email ?? '(no email)',
      createdAt: u.created_at as string,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: Boolean(u.email_confirmed_at),
      onboarded: onboardedIds.has(u.id),
      recCount: recCounts.get(u.id) ?? 0,
      credits: creditsMap.has(u.id) ? (creditsMap.get(u.id) as number) : null,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // 3. Headline metrics.
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const total = rows.length
  const newThisWeek = rows.filter((r) => now - new Date(r.createdAt).getTime() < 7 * day).length
  const newThisMonth = rows.filter((r) => now - new Date(r.createdAt).getTime() < 30 * day).length
  const onboardedCount = rows.filter((r) => r.onboarded).length

  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-8 md:px-8">
      <div className="max-w-4xl mx-auto">
        <AdminNav active="/admin/users" />

        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-4xl text-white tracking-wide">USERS</h1>
          <span className="bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <p className="text-[#6B7280] text-sm mb-8">
          Every registered account, newest first. There is no per-signup email by design — check here for growth.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total users" value={total} accent />
          <StatCard label="New this week" value={newThisWeek} />
          <StatCard label="New this month" value={newThisMonth} />
          <StatCard label="Onboarded" value={`${onboardedCount}/${total}`} />
        </div>

        {rows.length === 0 ? (
          <div className="bg-[#0F2040] border border-dashed border-[#1A3A5C] rounded-lg p-10 text-center">
            <p className="text-white font-semibold mb-1">No users yet</p>
            <p className="text-[#6B7280] text-sm">New signups will appear here as they register.</p>
          </div>
        ) : (
          <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg overflow-hidden">
            {/* Header row — hidden on mobile, table collapses to stacked cards */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#1A3A5C] text-[#6B7280] text-xs uppercase tracking-wide">
              <span>Email</span>
              <span className="text-right w-24">Joined</span>
              <span className="text-right w-24">Last active</span>
              <span className="text-right w-16">Recs</span>
              <span className="text-right w-16">Credits</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-2 md:grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 gap-y-1 px-4 py-3 border-b border-[#1A3A5C] last:border-b-0 hover:bg-[#0A1628]/40 transition-colors"
              >
                <div className="col-span-2 md:col-span-1 flex items-center gap-2 min-w-0">
                  <span className="text-white text-sm truncate">{r.email}</span>
                  {!r.confirmed && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] shrink-0">
                      UNCONFIRMED
                    </span>
                  )}
                  {r.onboarded ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] shrink-0">
                      ONBOARDED
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#6B7280]/10 text-[#6B7280] shrink-0">
                      NO PROFILE
                    </span>
                  )}
                </div>
                <span className="text-[#9CA3AF] text-xs md:text-sm md:text-right md:w-24 font-mono">
                  <span className="md:hidden text-[#6B7280] uppercase mr-1">Joined </span>{formatDate(r.createdAt)}
                </span>
                <span className="text-[#9CA3AF] text-xs md:text-sm md:text-right md:w-24 font-mono">
                  <span className="md:hidden text-[#6B7280] uppercase mr-1">Active </span>{formatRelative(r.lastSignInAt)}
                </span>
                <span className="text-[#9CA3AF] text-xs md:text-sm md:text-right md:w-16 font-mono">
                  <span className="md:hidden text-[#6B7280] uppercase mr-1">Recs </span>{r.recCount}
                </span>
                <span className="text-xs md:text-sm md:text-right md:w-16 font-mono text-[#9CA3AF]">
                  <span className="md:hidden text-[#6B7280] uppercase mr-1">Credits </span>{r.credits ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
