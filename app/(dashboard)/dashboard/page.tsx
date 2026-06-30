import Link from 'next/link'
import Image from 'next/image'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminNavLink } from '@/components/AdminNavLink'
import CreditBalance from '@/components/CreditBalance'
import { getActiveCategories, getRecentComparisons } from '@/lib/gear'
import { CategoryGrid } from '@/components/CategoryGrid'

interface RecommendationRow {
  id: string
  created_at: string
  category_id: string
  gear_categories: { name: string; slug: string } | null
  recommendation_json: { topPick?: { productName?: string } } | null
}

interface RecentComparisonRow {
  id: string
  created_at: string
  winner_product_name: string | null
  external_products: string[] | null
  gear_categories: { name: string; slug: string } | null
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getFirstName(email: string): string {
  const local = email.split('@')[0]
  const cleaned = local.replace(/[^a-zA-Z]/g, ' ').trim()
  if (!cleaned) return 'Athlete'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).split(' ')[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: { user } }, categories] = await Promise.all([
    supabase.auth.getUser(),
    getActiveCategories(),
  ])

  const adminDb = createAdminClient()

  const [recentResult, recentCompsResult] = await Promise.all([
    user
      ? adminDb
          .from('gear_recommendations')
          .select('id, created_at, category_id, gear_categories(name, slug), recommendation_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
    user
      ? getRecentComparisons(user.id)
      : Promise.resolve([]),
  ])

  const recentRecs = (recentResult.data as RecommendationRow[] | null) ?? []
  const recentComps = (recentCompsResult as unknown as RecentComparisonRow[]) ?? []
  const firstName = user?.email ? getFirstName(user.email) : 'Athlete'

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at top, #0F2040 0%, #0A1628 70%)' }}
    >
      {/* Hero — logo centered, settings top-right */}
      <div className="relative flex items-center justify-center pt-14 pb-10 px-6">
        <Image
          src="/logo-sidebar.svg"
          alt="Tapr"
          width={280}
          height={143}
          priority
          className="w-[220px] sm:w-[280px] h-auto"
        />
        <div className="absolute right-6 top-4 md:top-6 flex items-center gap-3">
          <CreditBalance />
          <AdminNavLink />
          <Link
            href="/settings"
            className="text-[#D1D5DB] hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-[#ffffff08]"
            aria-label="Settings"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div className="text-center px-6 pb-10">
        <p className="text-[#D1D5DB] text-base">
          What are you shopping for, <span className="text-white font-semibold">{firstName}</span>?
        </p>
        <p className="text-[#9CA3AF] text-xs mt-2">
          Get an AI recommendation, or compare your shortlist side-by-side.
        </p>
      </div>

      {/* Matrix cards */}
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <CategoryGrid categories={categories} />
      </div>

      {/* Recent activity */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {recentRecs.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-2xl text-white mb-4">RECENT RECOMMENDATIONS</h2>
            <div className="flex flex-col gap-2">
              {recentRecs.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/gear/${rec.gear_categories?.slug ?? rec.category_id}/recommendation?id=${rec.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-md border border-[#1A3A5C] hover:border-[#FF6B35] hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 transition-all duration-200 group"
                >
                  <div>
                    <p className="text-white text-sm font-semibold group-hover:text-[#FF6B35] transition-colors">
                      {rec.gear_categories?.name ?? 'Gear'}
                      {rec.recommendation_json?.topPick?.productName && (
                        <span className="text-[#9CA3AF] font-normal"> · {rec.recommendation_json.topPick.productName}</span>
                      )}
                    </p>
                    <p className="text-[#9CA3AF] text-sm">{formatDate(rec.created_at)}</p>
                  </div>
                  <span className="text-[#6B7280] text-xs group-hover:text-[#FF6B35] transition-colors">View →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {recentComps.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl text-white mb-4">RECENT COMPARISONS</h2>
            <div className="flex flex-col gap-2">
              {recentComps.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/gear/${comp.gear_categories?.slug}/compare?id=${comp.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-md border border-[#1A3A5C] hover:border-[#FF6B35] hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 transition-all duration-200 group"
                >
                  <div>
                    <p className="text-white text-sm font-semibold group-hover:text-[#FF6B35] transition-colors">
                      {comp.gear_categories?.name ?? 'Gear'}
                      {comp.winner_product_name && (
                        <span className="text-[#9CA3AF] font-normal"> · Winner: {comp.winner_product_name}</span>
                      )}
                    </p>
                    <p className="text-[#9CA3AF] text-sm">{formatDate(comp.created_at)}</p>
                  </div>
                  <span className="text-[#6B7280] text-xs group-hover:text-[#FF6B35] transition-colors">View →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-[#1A3A5C] text-center text-[#6B7280] text-xs">
          Tapr earns a commission on purchases made through our links. This never influences our recommendations.
        </div>
      </div>
    </div>
  )
}
