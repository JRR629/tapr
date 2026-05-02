import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComingSoonCard } from '@/components/ComingSoonCard'

export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: { category: string }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: category, error } = await supabase
    .from('gear_categories')
    .select('id, name, slug, description, is_active, coming_soon_email_capture')
    .eq('slug', categorySlug)
    .single()

  if (error || !category) notFound()

  // Inactive → coming soon
  if (!category.is_active) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <ComingSoonCard
            categoryName={category.name}
            categorySlug={category.slug}
            description={category.description}
          />
        </div>
        <footer className="text-center text-[#6B7280] text-xs py-6 border-t border-[#1A3A5C] mt-12">
          Tapr earns a commission on purchases made through our links. This never influences our recommendations.
        </footer>
      </div>
    )
  }

  // Check for existing recommendations for this category
  const { data: existingRecs } = user
    ? await supabase
        .from('gear_recommendations')
        .select('id, created_at, recommendation_json')
        .eq('user_id', user.id)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: null }

  function getTopPickName(rec: { recommendation_json: unknown }): string | null {
    try {
      const json = rec.recommendation_json as { topPick?: { productName?: string } } | null
      return json?.topPick?.productName ?? null
    } catch {
      return null
    }
  }

  const latest = existingRecs?.[0] ?? null

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-2">
        {category.name}
      </p>
      <h1 className="font-display text-5xl text-white mb-3">
        {category.name.toUpperCase()}
      </h1>
      {category.description && (
        <p className="text-[#9CA3AF] text-base leading-relaxed mb-8">{category.description}</p>
      )}

      {!latest && (
        <div className="bg-[#0F2040] border border-[#FF6B35] rounded-lg p-6 mb-6">
          <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-wide mb-3">How It Works</p>
          <div className="flex flex-col gap-3 mb-6">
            {[
              'Answer a few quick questions about your race and preferences',
              'Our AI matches your profile against real athlete reviews',
              'Get a personalized recommendation in under 30 seconds',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-mono text-[#FF6B35] text-sm font-bold shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[#D1D5DB] text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
          <Link
            href={`/gear/${categorySlug}/questionnaire`}
            className="inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold px-6 py-3 rounded-md transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
          >
            Get My Recommendation
          </Link>
        </div>
      )}

      {latest && (
        <>
          <div className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-6 mb-6">
            <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-1">Start Fresh</p>
            <p className="text-white font-semibold mb-1">Get a new recommendation</p>
            <p className="text-[#9CA3AF] text-base mb-5 leading-relaxed">
              Answer the questions again — useful if your race, budget, or goals have changed.
            </p>
            <Link
              href={`/gear/${categorySlug}/questionnaire`}
              className="inline-flex items-center justify-center border border-[#1A3A5C] hover:border-[#FF6B35] text-white px-6 py-3 rounded-md transition-all min-h-[44px]"
            >
              Start New Recommendation
            </Link>
          </div>

          {existingRecs && existingRecs.length > 0 && (
            <div>
              <p className="text-[#6B7280] text-xs uppercase tracking-wide mb-3 font-semibold">Past Recommendations</p>
              <div className="flex flex-col gap-2">
                {existingRecs.map((rec) => {
                  const winner = getTopPickName(rec as { recommendation_json: unknown })
                  return (
                    <Link
                      key={rec.id}
                      href={`/gear/${categorySlug}/recommendation?id=${rec.id}`}
                      className="flex items-center justify-between px-4 py-3 rounded-md border border-[#1A3A5C] hover:border-[#FF6B35] hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 transition-all duration-200 group"
                    >
                      <div>
                        <p className="text-white text-sm font-semibold group-hover:text-[#FF6B35] transition-colors">
                          {winner ? `Winner: ${winner}` : 'View Recommendation'}
                        </p>
                        <p className="text-[#9CA3AF] text-xs">{formatDate(rec.created_at)}</p>
                      </div>
                      <span className="text-[#6B7280] text-xs group-hover:text-[#FF6B35] transition-colors">View →</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <footer className="text-center text-[#6B7280] text-xs py-6 border-t border-[#1A3A5C] mt-12">
        Tapr earns a commission on purchases made through our links. This never influences our recommendations.
      </footer>
    </div>
  )
}
