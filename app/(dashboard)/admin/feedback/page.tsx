import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CORRECTION_TYPE_LABELS: Record<string, string> = {
  price: 'Price incorrect',
  specs: 'Specs wrong',
  availability: 'Unavailable / discontinued',
  recommendation_quality: 'Recommendation quality',
  other: 'Other',
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    reviewed: 'bg-[#60A5FA]/10 text-[#60A5FA]',
    added: 'bg-[#22C55E]/10 text-[#22C55E]',
    resolved: 'bg-[#22C55E]/10 text-[#22C55E]',
    declined: 'bg-[#EF4444]/10 text-[#EF4444]',
  }
  const label =
    status.charAt(0).toUpperCase() + status.slice(1)
  const cls = styles[status] ?? 'bg-[#6B7280]/10 text-[#6B7280]'
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncate(str: string | null | undefined, len: number) {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '…' : str
}

interface ProductSuggestion {
  id: string
  user_id: string
  category_slug: string
  brand: string | null
  model_name: string
  product_url: string | null
  notes: string | null
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

interface ProductCorrection {
  id: string
  user_id: string
  product_id: string | null
  recommendation_id: string | null
  correction_type: string
  description: string
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  product_name: string | null
  brand: string | null
}

export default async function AdminFeedbackPage() {
  // Auth check — same pattern as admin products page
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect('/dashboard')
  }

  const adminClient = createAdminClient()

  const [suggestionsResult, correctionsResult] = await Promise.all([
    adminClient
      .from('product_suggestions')
      .select(`
        id, user_id, category_slug, brand, model_name,
        product_url, notes, status, admin_notes,
        created_at, updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(100),
    adminClient
      .from('product_corrections')
      .select(`
        id, user_id, product_id, recommendation_id,
        correction_type, description, status, admin_notes,
        created_at, updated_at,
        gear_products ( name, brand )
      `)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const suggestions: ProductSuggestion[] = suggestionsResult.data ?? []

  // Flatten nested join result
  const corrections: ProductCorrection[] = (correctionsResult.data ?? []).map((row: Record<string, unknown>) => {
    const gp = row.gear_products as { name?: string; brand?: string } | null
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      product_id: row.product_id as string | null,
      recommendation_id: row.recommendation_id as string | null,
      correction_type: row.correction_type as string,
      description: row.description as string,
      status: row.status as string,
      admin_notes: row.admin_notes as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      product_name: gp?.name ?? null,
      brand: gp?.brand ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-8 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Page heading */}
        <h1 className="font-display text-4xl text-white tracking-wide mb-8">USER FEEDBACK</h1>

        {/* === Product Suggestions === */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-2xl text-white tracking-wide">PRODUCT SUGGESTIONS</h2>
            <span className="bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold px-2 py-0.5 rounded-full">
              {suggestions.length}
            </span>
          </div>

          {suggestions.length === 0 ? (
            <p className="text-[#6B7280] text-sm">No submissions yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold text-sm">
                          {s.brand ? `${s.brand} ` : ''}
                          {s.model_name}
                        </span>
                        <span className="text-[#6B7280] text-xs bg-[#1A3A5C]/60 px-2 py-0.5 rounded">
                          {s.category_slug}
                        </span>
                      </div>

                      {s.product_url && (
                        <a
                          href={s.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF6B35] text-xs hover:underline break-all"
                        >
                          {truncate(s.product_url, 80)}
                        </a>
                      )}

                      {s.notes && (
                        <p className="text-[#9CA3AF] text-sm mt-1.5">{truncate(s.notes, 200)}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={s.status} />
                      <span className="text-[#6B7280] text-xs">{formatDate(s.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-[#1A3A5C] mb-12" />

        {/* === Corrections / Issues === */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-2xl text-white tracking-wide">CORRECTIONS / ISSUES</h2>
            <span className="bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold px-2 py-0.5 rounded-full">
              {corrections.length}
            </span>
          </div>

          {corrections.length === 0 ? (
            <p className="text-[#6B7280] text-sm">No submissions yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {corrections.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold text-sm">
                          {c.product_name
                            ? `${c.brand ? c.brand + ' ' : ''}${c.product_name}`
                            : 'Unknown product'}
                        </span>
                        <span className="text-[#9CA3AF] text-xs bg-[#1A3A5C]/60 px-2 py-0.5 rounded">
                          {CORRECTION_TYPE_LABELS[c.correction_type] ?? c.correction_type}
                        </span>
                      </div>

                      <p className="text-[#9CA3AF] text-sm mt-1">{truncate(c.description, 150)}</p>

                      {c.recommendation_id && (
                        <p className="text-[#6B7280] text-xs mt-1.5">From recommendation</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={c.status} />
                      <span className="text-[#6B7280] text-xs">{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
