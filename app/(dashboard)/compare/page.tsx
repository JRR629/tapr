import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Waves, Watch, Eye, Shirt, Footprints, Zap, Bike, Package, GitCompareArrows } from 'lucide-react'

interface ComparisonRow {
  id: string
  created_at: string
  winner_product_name: string | null
  external_products: string[]
  gear_categories: { name: string; slug: string } | null
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const categoryIcons: Record<string, React.ReactNode> = {
  wetsuits: <Waves className="w-6 h-6" />,
  'gps-watches': <Watch className="w-6 h-6" />,
  goggles: <Eye className="w-6 h-6" />,
  'tri-suits': <Shirt className="w-6 h-6" />,
  'running-shoes': <Footprints className="w-6 h-6" />,
  nutrition: <Zap className="w-6 h-6" />,
  bikes: <Bike className="w-6 h-6" />,
  accessories: <Package className="w-6 h-6" />,
}

export default async function ComparePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: categories, error }, { data: pastComparisons }, subscriptionResult] = await Promise.all([
    supabase
      .from('gear_categories')
      .select('id, name, slug, description, is_active')
      .order('name'),
    user
      ? supabase
          .from('gear_comparisons')
          .select('id, created_at, winner_product_name, external_products, gear_categories(name, slug)')
          .eq('user_id', user.id)
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
  ])

  const isPro = subscriptionResult?.data?.plan === 'pro' && subscriptionResult?.data?.status === 'active'

  if (error) notFound()

  const active = (categories ?? []).filter((c) => c.is_active)
  const comingSoon = (categories ?? []).filter((c) => !c.is_active)

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <GitCompareArrows className="w-6 h-6 text-[#FF6B35]" />
        <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-[0.2em]">Pro Feature</p>
      </div>
      <h1 className="font-display text-5xl text-white mb-3">COMPARE PRODUCTS</h1>
      <div className="flex items-center gap-3 mb-4">
        {isPro ? (
          <span className="text-[#22C55E] text-sm font-semibold">Pro · 10 comparisons/day · up to 4 products</span>
        ) : (
          <span className="text-[#6B7280] text-sm">
            Free · Comparison is a Pro feature ·{' '}
            <a href="/billing" className="text-[#FF6B35] hover:underline font-semibold">Upgrade to Pro</a>
          </span>
        )}
      </div>
      <p className="text-[#9CA3AF] mb-10 leading-relaxed">
        Pick a category to start a head-to-head comparison. Select 2–4 products and get a personalized analysis grounded in expert reviews.
      </p>

      {/* Active categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {active.map((category) => (
          <Link
            key={category.slug}
            href={`/gear/${category.slug}/compare`}
            className="group bg-[#0F2040] border border-[#1A3A5C] hover:border-[#FF6B35] rounded-lg p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 duration-200 flex items-start gap-4"
          >
            <span className="text-[#FF6B35] mt-0.5 shrink-0">
              {categoryIcons[category.slug] ?? <Package className="w-6 h-6" />}
            </span>
            <div>
              <h2 className="font-display text-2xl text-white group-hover:text-[#FF6B35] transition-colors leading-tight">
                {category.name.toUpperCase()}
              </h2>
              {category.description && (
                <p className="text-[#9CA3AF] text-base mt-1 leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Coming soon categories */}
      {comingSoon.length > 0 && (
        <>
          <p className="text-[#6B7280] text-xs uppercase tracking-wide font-semibold mb-3">Coming Soon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comingSoon.map((category) => (
              <div
                key={category.slug}
                className="bg-[#0F2040] border border-dashed border-[#1A3A5C] rounded-lg p-5 opacity-50 flex items-center gap-4"
              >
                <span className="text-[#6B7280] shrink-0">
                  {categoryIcons[category.slug] ?? <Package className="w-5 h-5" />}
                </span>
                <span className="font-display text-xl text-[#6B7280]">{category.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Past comparisons */}
      {pastComparisons && pastComparisons.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-2xl text-white mb-4">PAST COMPARISONS</h2>
          <div className="flex flex-col gap-2">
            {(pastComparisons as unknown as ComparisonRow[]).map((comp) => (
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
    </div>
  )
}
