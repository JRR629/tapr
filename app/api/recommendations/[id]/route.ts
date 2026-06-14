import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('gear_recommendations')
      .select(`
        id,
        recommendation_json,
        created_at,
        category_id,
        top_pick_product_id,
        runner_up_product_id,
        gear_categories(name, slug)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Recommendation not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Enrich sourcesDrawnFrom with real URLs from the review_sources table.
    // This handles both old recommendations (plain strings) and new ones (already enriched at stream time).
    const productIds = [data.top_pick_product_id, data.runner_up_product_id].filter(Boolean) as string[]

    if (productIds.length > 0) {
      const { data: sources } = await adminDb
        .from('review_sources')
        .select('source_name, source_url')
        .in('product_id', productIds)
        .not('source_url', 'is', null)

      if (sources && sources.length > 0) {
        const urlMap: Record<string, string> = {}
        for (const s of sources) {
          if (s.source_name && s.source_url) {
            urlMap[s.source_name] = s.source_url
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recJson = data.recommendation_json as any
        if (Array.isArray(recJson?.sourcesDrawnFrom)) {
          recJson.sourcesDrawnFrom = recJson.sourcesDrawnFrom.map(
            (s: string | { name: string; url?: string }) => {
              const name = typeof s === 'string' ? s : s.name
              const url = urlMap[name]
              return url ? { name, url } : { name }
            }
          )
        }
      }
    }

    // Re-resolve product image URLs from current DB state. Saved JSONs may have
    // stale imageUrl values (e.g. raw Amazon CDN URLs) baked in at creation time.
    // We override with the current Supabase Storage URL (built from image_path) so
    // image swaps (e.g. background-removed PNG uploads) propagate to old recs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recJsonAny = data.recommendation_json as any

    // Collect all productIds referenced anywhere in the JSON
    const collectedProductIds = new Set<string>()
    const collectProductIds = (node: unknown): void => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        for (const item of node) collectProductIds(item)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = node as Record<string, any>
      if (typeof obj.productId === 'string') collectedProductIds.add(obj.productId)
      for (const key of Object.keys(obj)) collectProductIds(obj[key])
    }
    collectProductIds(recJsonAny)

    if (collectedProductIds.size > 0) {
      const { data: products } = await adminDb
        .from('gear_products')
        .select('id, image_path')
        .in('id', Array.from(collectedProductIds))

      const pathMap: Record<string, string | null> = {}
      for (const p of products ?? []) {
        pathMap[p.id] = p.image_path
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const patchImageUrls = (node: unknown): void => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) {
          for (const item of node) patchImageUrls(item)
          return
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = node as Record<string, any>
        if (typeof obj.productId === 'string' && 'imageUrl' in obj) {
          const path = pathMap[obj.productId]
          if (path && supabaseUrl) {
            obj.imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${path}`
          }
        }
        for (const key of Object.keys(obj)) patchImageUrls(obj[key])
      }
      patchImageUrls(recJsonAny)
    }

    return Response.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[recommendations/id GET]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
