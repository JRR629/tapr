import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const bodySchema = z.object({
  pack: z.enum(['3', '10', '25']),
})

const PACK_PRICE_IDS: Record<string, string> = {
  '3': process.env.STRIPE_CREDITS_3_PRICE_ID!,
  '10': process.env.STRIPE_CREDITS_10_PRICE_ID!,
  '25': process.env.STRIPE_CREDITS_25_PRICE_ID!,
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { pack } = parsed.data
    const priceId = PACK_PRICE_IDS[pack]

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true&pack=${pack}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      customer_email: user.email,
      metadata: { supabase_user_id: user.id, pack },
    })

    return Response.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error('[stripe/checkout]', error)
    const message = error instanceof Error ? error.message : 'Something went wrong'
    return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
