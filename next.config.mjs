import { withSentryConfig } from '@sentry/nextjs'

// Security headers (item 21) applied to every route. A strict Content-Security-
// Policy is intentionally deferred — it needs careful allowlisting of Stripe,
// Supabase, Sentry, Vercel Analytics, and Anthropic, plus testing; a wrong CSP
// silently breaks the app. Add it as a dedicated, tested follow-up.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

// Sentry (item 8b). Source-map upload is intentionally NOT configured (needs an
// auth token + org/project); runtime error capture works without it. Add
// SENTRY_AUTH_TOKEN + org/project later if readable stack traces are wanted.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
