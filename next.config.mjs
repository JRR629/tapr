import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Sentry (item 8b). Source-map upload is intentionally NOT configured (needs an
// auth token + org/project); runtime error capture works without it. Add
// SENTRY_AUTH_TOKEN + org/project later if readable stack traces are wanted.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
