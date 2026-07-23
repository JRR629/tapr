import { createClient } from '@/lib/supabase/server'
import { enrichCitedSources } from '@/lib/sources'

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

    const { data, error } = await supabase
      .from('gear_comparisons')
      .select('id, comparison_json, created_at, category_id, product_ids, gear_categories(name, slug)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Comparison not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Enrich sourcesDrawnFrom with real URLs (handles old comparisons stored
    // without URLs, and preserves any already attached at stream time).
    // Sources live in review_sources for most categories, but in
    // product_review_mentions → review_articles for running shoes & nutrition.
    const productIds = (data.product_ids ?? []) as string[]
    if (productIds.length > 0) {
      const [{ data: sources }, { data: mentions }] = await Promise.all([
        supabase
          .from('review_sources')
          .select('source_name, source_url')
          .in('product_id', productIds)
          .not('source_url', 'is', null),
        supabase
          .from('product_review_mentions')
          .select('review_articles(source_name, url)')
          .in('product_id', productIds),
      ])

      const urlMap: Record<string, string> = {}
      for (const s of sources ?? []) {
        if (s.source_name && s.source_url) urlMap[s.source_name] = s.source_url
      }
      for (const m of mentions ?? []) {
        const ra = (m as { review_articles?: { source_name?: string; url?: string } | { source_name?: string; url?: string }[] }).review_articles
        const art = Array.isArray(ra) ? ra[0] : ra
        if (art?.source_name && art?.url) urlMap[art.source_name] = art.url
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compJson = data.comparison_json as any
      if (Array.isArray(compJson?.sourcesDrawnFrom)) {
        compJson.sourcesDrawnFrom = enrichCitedSources(compJson.sourcesDrawnFrom, urlMap)
      }
    }

    return Response.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[comparisons/id GET]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
