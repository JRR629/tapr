import * as Sentry from '@sentry/nextjs'

// Browser error monitoring (item 8b). No-ops without a DSN. The DSN is a
// NEXT_PUBLIC_ var because the browser SDK must read it client-side; it is
// send-only and safe to expose.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
}
