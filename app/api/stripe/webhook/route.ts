import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Service role — webhook handlers bypass RLS intentionally
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const userId = session.metadata?.supabase_user_id
        if (!userId) {
          console.error('[stripe/webhook] checkout.session.completed: missing supabase_user_id in metadata')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan: 'pro',
          status: subscription.status,
          current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end: number }
        const userId = await getUserIdFromCustomer(subscription.customer as string)
        if (!userId) break

        const plan = subscription.status === 'active' ? 'pro' : 'free'

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end: number }
        const userId = await getUserIdFromCustomer(subscription.customer as string)
        if (!userId) break

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan: 'free',
          status: 'canceled',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        break
      }

      default:
        // Unhandled event type — not an error
        break
    }

    return Response.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[stripe/webhook] handler error:', error)
    return Response.json({ error: 'Webhook handler failed', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()
  return data?.user_id ?? null
}
