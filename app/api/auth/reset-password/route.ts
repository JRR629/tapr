import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { z } from 'zod'
import { checkRateLimit, clientIp } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit('reset_password', clientIp(request)))) {
      return Response.json({ error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid email address', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }

    const { email } = parsed.data
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://taprai.com'

    if (!process.env.RESEND_API_KEY) {
      console.error('[reset-password] RESEND_API_KEY missing')
      return Response.json(
        { error: 'Email service unavailable', code: 'EMAIL_NOT_CONFIGURED' },
        { status: 500 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (error) {
      // Don't leak account existence — return success regardless
      console.error('[reset-password] generateLink error:', error.message)
      return Response.json({ data: { sent: true } }, { status: 200 })
    }

    const tokenHash = data?.properties?.hashed_token
    if (!tokenHash) {
      console.error('[reset-password] no hashed_token returned')
      return Response.json({ data: { sent: true } }, { status: 200 })
    }

    const recoveryLink = `${appUrl}/auth/update-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM = process.env.RESEND_FROM_EMAIL ?? 'jon@taprai.com'

    const { error: sendError } = await resend.emails.send({
      from: `Tapr <${FROM}>`,
      to: email,
      subject: 'Reset your Tapr password',
      html: buildHtml(recoveryLink, appUrl),
    })

    if (sendError) {
      console.error('[reset-password] Resend error:', sendError.message)
      return Response.json(
        { error: 'Failed to send reset email', code: 'EMAIL_SEND_FAILED' },
        { status: 500 }
      )
    }

    return Response.json({ data: { sent: true } }, { status: 200 })
  } catch (error) {
    console.error('[reset-password]', error)
    return Response.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

function buildHtml(link: string, _appUrl: string): string {
  // Hardcoded public URL — Gmail's image proxy can't fetch localhost during local testing,
  // and using NEXT_PUBLIC_APP_URL would break logo loading in dev. The production domain
  // serves /logo-email.png statically even on the Coming Soon page.
  const logoUrl = 'https://www.taprai.com/logo-email.png'
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#D1D5DB;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0A1628;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#0A1628;border:1px solid #1A3A5C;border-radius:12px;padding:32px;">
          <tr><td align="center" style="padding-bottom:24px;"><img src="${logoUrl}" alt="Tapr" width="160" style="display:block;height:auto;" /></td></tr>
          <tr><td style="padding-bottom:16px;"><h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Reset your password</h1></td></tr>
          <tr><td style="padding-bottom:24px;color:#D1D5DB;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 12px 0;">Someone (hopefully you) requested a password reset for your Tapr account.</p>
            <p style="margin:0;">Click the button below to set a new password. This link expires in 1 hour.</p>
          </td></tr>
          <tr><td align="center" style="padding-bottom:24px;"><a href="${link}" style="display:inline-block;background:#FF6B35;color:#FFFFFF;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:8px;font-size:15px;">Set a new password</a></td></tr>
          <tr><td style="padding-bottom:8px;color:#6B7280;font-size:13px;line-height:1.6;">
            <p style="margin:0;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="margin:8px 0 0 0;word-break:break-all;color:#9CA3AF;">${link}</p>
          </td></tr>
          <tr><td style="border-top:1px solid #1A3A5C;padding-top:20px;margin-top:24px;color:#6B7280;font-size:12px;line-height:1.6;">
            <p style="margin:0;">If you didn't request a password reset, you can safely ignore this email — your account is still secure.</p>
            <p style="margin:12px 0 0 0;">Tapr · taprai.com</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}
