import { Resend } from 'resend'
import { z } from 'zod'

const notifySchema = z.object({
  email: z.string().email('Invalid email address'),
})

const NOTIFY_TO = 'jon@taprai.com'

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()

    const parsed = notifySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Please enter a valid email address.', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }

    const { email } = parsed.data

    if (!process.env.RESEND_API_KEY) {
      console.warn('[notify] RESEND_API_KEY not configured')
      return Response.json({ data: { success: true } }, { status: 200 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

    await Promise.all([
      resend.emails.send({
        from: FROM,
        to: NOTIFY_TO,
        subject: `Tapr waitlist signup: ${email}`,
        text: `New pre-launch signup:\n\n${email}`,
      }),
      resend.emails.send({
        from: FROM,
        to: email,
        subject: "You're on the Tapr waitlist",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0A1628; color: #ffffff; padding: 40px 32px; border-radius: 8px;">
            <div style="color: #FF6B35; font-size: 22px; font-weight: 700; margin-bottom: 24px; letter-spacing: 0.05em;">TAPR</div>
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px; color: #ffffff;">You're on the list.</h1>
            <p style="color: #D1D5DB; line-height: 1.6; margin: 0 0 16px;">
              We're putting the finishing touches on Tapr — personalized triathlon gear recommendations grounded in real review data.
            </p>
            <p style="color: #D1D5DB; line-height: 1.6; margin: 0 0 32px;">
              You'll get an email the moment we go live. No spam, just the one launch email.
            </p>
            <p style="color: #6B7280; font-size: 13px; margin: 0;">— Jon, Founder of Tapr</p>
            <hr style="border: none; border-top: 1px solid #1A3A5C; margin: 32px 0;" />
            <p style="color: #6B7280; font-size: 12px; margin: 0;">Taprai, LLC · taprai.com</p>
          </div>
        `,
      }),
    ])

    return Response.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error('[notify POST]', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
