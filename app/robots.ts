import type { MetadataRoute } from 'next'

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.taprai.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth-walled / non-indexable app surfaces.
      disallow: ['/dashboard', '/admin', '/api', '/onboarding', '/auth', '/profile', '/billing', '/settings', '/compare', '/gear'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
