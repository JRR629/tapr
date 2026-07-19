import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Confirms a specific purchase actually granted credits, by checking for the
// credit_transactions row the webhook writes (keyed by stripe_session_id). The
// billing page polls this after redirect instead of trusting ?success=true —
// which only reflects the redirect, not proof the webhook ran and credits landed.
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const sessionId = new URL(request.url).searchParams.get('session_id')
  if (!sessionId || sessionId.length > 200) {
    return Response.json({ error: 'Missing or invalid session_id', code: 'BAD_REQUEST' }, { status: 400 })
  }

  // Service role scoped strictly to the authenticated user's own row — avoids any
  // RLS ambiguity on credit_transactions while never exposing another user's data.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('credit_transactions')
    .select('amount')
    .eq('stripe_session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return Response.json({ error: 'Failed to verify purchase', code: 'INTERNAL_ERROR' }, { status: 500 })
  }

  if (data) {
    return Response.json({ confirmed: true, amount: data.amount })
  }
  return Response.json({ confirmed: false })
}
