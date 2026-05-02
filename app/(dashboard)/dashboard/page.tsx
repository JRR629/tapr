import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getActiveCategories } from '@/lib/gear'
import { CategoryGrid } from '@/components/CategoryGrid'
import type { AthleteProfile } from '@/types/profile'

interface RecommendationRow {
  id: string
  created_at: string
  category_id: string
  gear_categories: { name: string; slug: string } | null
  recommendation_json: { topPick?: { productName?: string } } | null
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

  const period = new Date().toISOString().slice(0, 10)

  const [recentResult, subscriptionResult, usageResult] = await Promise.all([
    user
      ? supabase
          .from('gear_recommendations')
          .select('id, created_at, category_id, gear_categories(name, slug), recommendation_json')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user!.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('usage_counters')
          .select('rec_count')
          .eq('user_id', user!.id)
          .eq('period', period)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const recentRecs = (recentResult.data as RecommendationRow[] | null) ?? []
  const isPro = subscriptionResult.data?.plan === 'pro' && subscriptionResult.data?.status === 'active'
  const recCount = (usageResult.data as { rec_count: number } | null)?.rec_count ?? 0
  const dailyLimit = isPro ? null : 3
  const firstName = user?.email ? getFirstName(user.email) : 'Athlete'

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-5xl md:text-6xl text-white leading-none mb-1">
          YOUR MATCH AWAITS, {firstName.toUpperCase()}.
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <p className="text-[#D1D5DB] text-base">What are we finding today?</p>
          <span className="text-[#1A3A5C]">·</span>
          {isPro ? (
            <span className="text-[#22C55E] text-xs font-semibold">Pro · Unlimited recommendations</span>
          ) : (
            <span className="text-[#9CA3AF] text-sm">
              {recCount}/3 recommendations today ·{' '}
              <Link href="/billing" className="text-[#FF6B35] hover:text-[#E55A24] transition-colors font-semibold">
                Upgrade to Pro
              </Link>
            </span>
          )}
        </div>
      </div>

      {/* Category grid — the main action */}
      <CategoryGrid categories={categories} />

      {/* Recent recommendations */}
      {recentRecs.length > 0 && (
        <div className="mt-12">
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
                      <span className="text-[#9CA3AF] font-normal"> · Winner: {rec.recommendation_json.topPick.productName}</span>
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

      <footer className="text-center text-[#6B7280] text-xs py-6 border-t border-[#1A3A5C] mt-12">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </footer>
    </div>
  )
}
