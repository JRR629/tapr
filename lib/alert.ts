// Best-effort founder alert for critical, money-touching failures (e.g. a Stripe
// payment that succeeded but whose credit grant failed → "paid but no credits").
// NEVER throws — alerting must not break the calling handler. Falls back to a
// console error if Resend is unconfigured or the send fails.
export async function alertFounder(subject: string, body: string): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.ALERT_EMAIL ?? 'jon@taprai.com'
    const from = process.env.RESEND_FROM_EMAIL ?? 'jon@taprai.com'
    if (!apiKey) {
      console.error('[alert] RESEND_API_KEY missing — alert NOT sent:', subject, body)
      return
    }
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({ from, to, subject: `[Tapr ALERT] ${subject}`, text: body })
  } catch (err) {
    console.error('[alert] failed to send founder alert:', subject, '|', err)
  }
}
