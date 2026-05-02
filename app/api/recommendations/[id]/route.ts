import { createClient } from '@/lib/supabase/server'

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
      const { data: sources } = await supabase
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

    return Response.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[recommendations/id GET]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
