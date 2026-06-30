import * as Sentry from '@sentry/nextjs'

// Server-side error monitoring (item 8b). No-ops when the DSN is absent so local
// dev and builds work without Sentry configured.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
  })
}
