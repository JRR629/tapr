import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: 'Failed to fetch credits', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  return Response.json({ credits: data?.credits_remaining ?? 0 })
}
