import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!sub?.stripe_customer_id) {
      return Response.json({ error: 'No billing account found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    })

    return Response.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error('[stripe/portal]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
