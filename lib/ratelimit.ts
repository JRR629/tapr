import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// IP-based rate limiting for public, unauthenticated endpoints (contact form,
// waitlist, category-notify, password reset) to stop email-bombing / spam.
//
// GRACEFUL FALLBACK: if Upstash isn't configured (no env vars — e.g. local dev
// or before the keys are added to Vercel), every check is allowed. Enforcement
// activates automatically once both env vars are present. This keeps the build
// and local dev working without the service.

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

// Fixed-window limiters, one per logical bucket. Limits are intentionally
// conservative — high enough never to block a real user, low enough to stop
// automated abuse. Tune the numbers here.
const limiters = redis
  ? {
      reset_password: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(5, '1 h'), prefix: 'tapr:rl:reset_password', analytics: false }),
      contact: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(5, '1 h'), prefix: 'tapr:rl:contact', analytics: false }),
      waitlist: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, '1 h'), prefix: 'tapr:rl:waitlist', analytics: false }),
      category_notify: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, '1 h'), prefix: 'tapr:rl:category_notify', analytics: false }),
    }
  : null

export type RateLimitBucket = 'reset_password' | 'contact' | 'waitlist' | 'category_notify'

// Returns true if the request is allowed, false if rate-limited.
// No-ops to `true` when Upstash is unconfigured, and fails OPEN on any Redis
// error — a rate-limiter outage must never take down signup or contact.
export async function checkRateLimit(bucket: RateLimitBucket, identifier: string): Promise<boolean> {
  if (!limiters) return true
  try {
    const { success } = await limiters[bucket].limit(identifier)
    return success
  } catch (err) {
    console.error('[ratelimit] check failed, allowing request:', err)
    return true
  }
}

// Best-effort client IP. On Vercel, `x-forwarded-for` is set to the real client
// IP (first entry). Falls back to a constant so local dev still works.
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}
