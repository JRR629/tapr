import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminNav } from '@/components/AdminNav'
import { AffiliateButton } from '@/components/AffiliateButton'

// Admin review dashboard for the recommendations users actually receive — so
// bad picks or broken retailer links can be spotted proactively (not just when
// a user reports them). Shows the top pick + runner-up for each recent rec, the
// link *source* per product (to flag fragile brand-page links), and a live
// "Test link" that routes through /api/affiliate/click.

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

interface ProductLite {
  id: string
  name: string
  brand: string
  affiliate_url: string | null
  amazon_asin: string | null
  amazon_link_confidence: string | null
  brand_url: string | null
}

// Resolve the link SOURCE (never the URL) using the same priority as the
// affiliate click route. Lets the admin see at a glance which links are fragile.
function linkSource(p: ProductLite | undefined): { label: string; cls: string } {
  if (!p) return { label: 'Product missing', cls: 'text-[#EF4444] bg-[#EF4444]/10' }
  if (p.affiliate_url) return { label: 'Affiliate', cls: 'text-[#22C55E] bg-[#22C55E]/10' }
  if (p.amazon_asin && (p.amazon_link_confidence === 'exact_current' || p.amazon_link_confidence === 'exact_prior'))
    return { label: 'Amazon', cls: 'text-[#22C55E] bg-[#22C55E]/10' }
  if (p.brand_url) return { label: 'Brand page ⚠', cls: 'text-[#F59E0B] bg-[#F59E0B]/10' }
  return { label: 'NO LINK 🚫', cls: 'text-[#EF4444] bg-[#EF4444]/10' }
}

interface RecRow {
  id: string
  created_at: string
  user_id: string
  top_pick_product_id: string | null
  runner_up_product_id: string | null
  gear_categories: { name: string; slug: string } | null
}

function displayName(p: ProductLite): string {
  // `name` sometimes already includes the brand — avoid "Nike Nike Vomero".
  return p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`
}

function PickLine({ role, product, categorySlug }: { role: string; product: ProductLite | undefined; categorySlug: string | undefined }) {
  const src = linkSource(product)
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-1.5">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="text-[#6B7280] text-xs uppercase tracking-wide w-20 shrink-0">{role}</span>
        <span className="text-white text-sm font-medium truncate">
          {product ? displayName(product) : '—'}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${src.cls}`}>{src.label}</span>
      </div>
      {product && (
        <AffiliateButton
          productId={product.id}
          categorySlug={categorySlug}
          label="Test link →"
          className="text-[#FF6B35] text-xs font-semibold hover:underline"
        />
      )}
    </div>
  )
}

export default async function AdminRecommendationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect('/dashboard')
  }

  const adminClient = createAdminClient()

  const { data: recsData } = await adminClient
    .from('gear_recommendations')
    .select('id, created_at, user_id, top_pick_product_id, runner_up_product_id, gear_categories(name, slug)')
    .order('created_at', { ascending: false })
    .limit(50)

  const recs = (recsData ?? []) as unknown as RecRow[]

  // Fetch the referenced products in one query.
  const productIds = Array.from(new Set(
    recs.flatMap((r) => [r.top_pick_product_id, r.runner_up_product_id]).filter(Boolean) as string[]
  ))
  const productMap = new Map<string, ProductLite>()
  if (productIds.length > 0) {
    const { data: products } = await adminClient
      .from('gear_products')
      .select('id, name, brand, affiliate_url, amazon_asin, amazon_link_confidence, brand_url')
      .in('id', productIds)
    for (const p of (products ?? []) as ProductLite[]) productMap.set(p.id, p)
  }

  // Map user ids → emails (best-effort; degrade to short id).
  const emailMap = new Map<string, string>()
  try {
    const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    for (const u of usersData?.users ?? []) if (u.email) emailMap.set(u.id, u.email)
  } catch { /* degrade gracefully */ }

  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-8 md:px-8">
      <div className="max-w-4xl mx-auto">
        <AdminNav active="/admin/recommendations" />

        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-4xl text-white tracking-wide">RECOMMENDATIONS</h1>
          <span className="bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold px-2 py-0.5 rounded-full">{recs.length}</span>
        </div>
        <p className="text-[#6B7280] text-sm mb-8">
          The 50 most recent recommendations. Check the picks and click <span className="text-[#FF6B35]">Test link</span> to
          verify each retailer page. <span className="text-[#F59E0B]">Brand page ⚠</span> links are the fragile kind that can rot.
        </p>

        {recs.length === 0 ? (
          <p className="text-[#6B7280] text-sm">No recommendations yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recs.map((r) => (
              <div key={r.id} className="bg-[#0F2040] border border-[#1A3A5C] rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <span className="text-[#9CA3AF] text-xs bg-[#1A3A5C]/60 px-2 py-0.5 rounded uppercase tracking-wide">
                    {r.gear_categories?.name ?? '—'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#6B7280] text-xs truncate max-w-[220px]">
                      {emailMap.get(r.user_id) ?? r.user_id.slice(0, 8)}
                    </span>
                    <span className="text-[#6B7280] text-xs">{formatDateTime(r.created_at)}</span>
                  </div>
                </div>
                <div className="border-t border-[#1A3A5C] pt-1">
                  <PickLine role="Top pick" product={r.top_pick_product_id ? productMap.get(r.top_pick_product_id) : undefined} categorySlug={r.gear_categories?.slug} />
                  <PickLine role="Runner-up" product={r.runner_up_product_id ? productMap.get(r.runner_up_product_id) : undefined} categorySlug={r.gear_categories?.slug} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
