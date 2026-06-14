import { z } from 'zod'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Please check your inputs.', code: 'VALIDATION_ERROR' }, { status: 422 })
    }

    const { name, email, message } = parsed.data

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: 'Email service not configured.', code: 'EMAIL_NOT_CONFIGURED' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM = process.env.RESEND_FROM_EMAIL ?? 'jon@taprai.com'

    await Promise.all([
      // Notification to owner
      resend.emails.send({
        from: FROM,
        to: 'jon@taprai.com',
        subject: `Tapr contact: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      }),
      // Confirmation to user
      resend.emails.send({
        from: FROM,
        to: email,
        subject: 'We got your message — Tapr',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0A1628; color: #ffffff; padding: 40px 32px; border-radius: 8px;">
            <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #ffffff;">Got it, ${name}.</h1>
            <p style="color: #D1D5DB; line-height: 1.6; margin: 0 0 16px;">
              Thanks for reaching out. We&apos;ll get back to you within 1–2 business days.
            </p>
            <p style="color: #D1D5DB; line-height: 1.6; margin: 0 0 32px;">Your message:</p>
            <blockquote style="border-left: 3px solid #FF6B35; padding-left: 16px; color: #9CA3AF; font-style: italic; margin: 0 0 32px;">
              ${message.replace(/\n/g, '<br>')}
            </blockquote>
            <p style="color: #6B7280; font-size: 13px; margin: 0;">— Jon, Founder of Tapr</p>
            <hr style="border: none; border-top: 1px solid #1A3A5C; margin: 32px 0;" />
            <p style="color: #6B7280; font-size: 12px; margin: 0;">Taprai, LLC · taprai.com</p>
          </div>
        `,
      }),
    ])

    return Response.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error('[contact POST]', error)
    return Response.json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
