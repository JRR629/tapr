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
      .select('stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single()

    if (sub?.plan === 'pro') {
      return Response.json({ error: 'Already subscribed to Pro', code: 'ALREADY_PRO' }, { status: 400 })
    }

    let customerId = sub?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
      }, { onConflict: 'user_id' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id },
    })

    return Response.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error('[stripe/checkout]', error)
    return Response.json({ error: 'Something went wrong', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
