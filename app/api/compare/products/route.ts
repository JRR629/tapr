import { createClient } from '@/lib/supabase/server'
import { getAllProductsByCategory } from '@/lib/gear'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return Response.json({ error: 'Missing category parameter', code: 'BAD_REQUEST' }, { status: 400 })
    }

    // Auth required — browsing is not Pro-gated but must be logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    // Resolve category slug → id
    const { data: categoryRow, error: categoryError } = await supabase
      .from('gear_categories')
      .select('id')
      .eq('slug', category)
      .eq('is_active', true)
      .single()

    if (categoryError || !categoryRow) {
      return Response.json({ error: 'Category not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const products = await getAllProductsByCategory(categoryRow.id)

    return Response.json({ data: products }, { status: 200 })
  } catch (error) {
    console.error('[compare/products GET]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
