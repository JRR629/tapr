import { headers } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { alertFounder } from '@/lib/alert'
import type Stripe from 'stripe'

const PACK_CREDITS: Record<string, number> = {
  '3': 3,
  '10': 10,
  '25': 25,
}

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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode !== 'payment') {
        return Response.json({ received: true }, { status: 200 })
      }

      const userId = session.metadata?.supabase_user_id
      const pack = session.metadata?.pack

      if (!userId || !pack) {
        console.error('[stripe/webhook] checkout.session.completed: missing metadata', { userId, pack })
        return Response.json({ received: true }, { status: 200 })
      }

      const credits = PACK_CREDITS[pack]
      if (!credits) {
        console.error('[stripe/webhook] unknown pack in metadata:', pack)
        return Response.json({ received: true }, { status: 200 })
      }

      const supabaseAdmin = createAdminClient()
      const { error } = await supabaseAdmin.rpc('add_credits', {
        p_user_id: userId,
        p_amount: credits,
        p_reason: `pack_${pack}`,
        p_stripe_session_id: session.id,
      })

      if (error) {
        console.error('[stripe/webhook] add_credits RPC failed:', error.message)
        // PAID BUT NO CREDITS — highest-severity failure. Alert the founder so it
        // can be reconciled manually. Stripe will also retry (we return 500).
        Sentry.captureException(new Error(`add_credits failed after payment: ${error.message}`), {
          extra: { userId, pack, credits, stripeSessionId: session.id },
        })
        await alertFounder(
          'Credit grant FAILED after payment',
          `User ${userId} paid for pack_${pack} (${credits} credits) but add_credits failed.\n` +
            `Stripe session: ${session.id}\nError: ${error.message}\n\n` +
            `ACTION: verify in Stripe, then manually grant credits if the retry does not succeed.`
        )
        return Response.json({ error: 'Failed to grant credits', code: 'INTERNAL_ERROR' }, { status: 500 })
      }
    }

    return Response.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[stripe/webhook] handler error:', error)
    return Response.json({ error: 'Webhook handler failed', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
