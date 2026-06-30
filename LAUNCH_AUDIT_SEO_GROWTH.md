# Tapr Launch Audit — Performance (Pass 6), SEO (Pass 7), Analytics/Ops (Pass 8)

← back to [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md)

## Performance

Build route sizes (actual `npm run build`): shared baseline **87.3 kB**; heaviest `/gear/[category]/compare` **169 kB**, auth pages **~165 kB**, `/gear/[category]/recommendation` 109 kB, `/dashboard` 106 kB, `/` 102 kB. Nothing alarming — acceptable for launch.

- **PERF-1 — `force-dynamic` on the marketing homepage (MEDIUM, XS fix).** `app/(marketing)/page.tsx:5` forces dynamic rendering on a page with **zero data fetching** (pure JSX). It opts the top-of-funnel SEO page out of static generation → a function invocation + worse TTFB on every visit for no benefit. **Fix:** delete the line; verify `/` flips from `ƒ` to `○` in the build. (`EmailCapture` is already a client child and works on a static page.)
- **PERF-2 — 38 `'use client'` files (LOW).** Auth/contact/billing pages are full client components shipping ~160–166 kB. Streaming pages (recommendation/questionnaire/compare) legitimately need client. Optional: split static shells into server components on auth pages. Low priority.
- **Good:** no N+1 / sequential awaits found; `lib/gear.ts` uses specific selects; `dashboard/page.tsx:44,51` uses `Promise.all`; deps are lean (lucide tree-shakes, Stripe.js only on billing); `next/font` with `display:'swap'` for all three fonts; marketing logo uses `next/image` `priority`. Raw `<img>` only appears in email-template strings (fine).
- **Largest CWV levers:** TTFB (fix PERF-1); LCP low risk; INP acceptable but monitor the streaming pages; CLS low.

## Technical SEO

- **SEO-1 — No `metadataBase` / Open Graph / Twitter / canonical (HIGH).** `app/layout.tsx:25-28` has only title+description. No OG/Twitter tags anywhere → every shared link (homepage, the guide) renders with no preview card on iMessage/Slack/X/FB — measurably worse CTR for an affiliate/SEO business. No canonical risks duplicate-content dilution as category/guide URLs grow. **Fix:** add `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!)` + default `openGraph`/`twitter` to root layout + an `opengraph-image`; per-page canonical on homepage/guide. Domain is `taprai.com`. **Effort:** S.
- **SEO-2 — No `sitemap.ts` / `robots.ts` / `manifest.ts` (HIGH).** All absent. No machine-readable sitemap, no robots policy, no `Sitemap:` pointer, no disallow for `/dashboard`,`/admin`,`/api`. **Fix:** `app/robots.ts` (allow `/`,`/guides/*`,legal; disallow `/dashboard`,`/admin`,`/api`,`/onboarding`,`/auth`) + `app/sitemap.ts` (public static routes + active category landings). **Effort:** S.
- **SEO-3 — No JSON-LD on the guide (MEDIUM).** `app/guides/best-gps-watch-triathlon/page.tsx` is statically rendered with metadata but no `Article`/`ItemList`/`Product` schema — the ideal rich-result candidate and your SEO tip of the spear. **Fix:** add `Article` + `ItemList` JSON-LD. **Effort:** S.
- **Indexability confirmed:** statically rendered (indexable): `/guides/*`, `/privacy`, `/terms`, `/contact`, `/launch`, auth pages. `/` is dynamic only because of PERF-1 — fixing it makes it static/indexable.

### Missing-metadata map
| Route | Page metadata? | Action |
|---|---|---|
| root `layout.tsx` | minimal | add OG/twitter/metadataBase (SEO-1) |
| `/` marketing | No | High — add metadata + de-`force-dynamic` |
| `/guides/best-gps-watch-triathlon` | Yes | add JSON-LD |
| `/privacy` `/terms` | Yes | ok |
| `/contact` `/launch` | No | Low — add basic metadata |
| auth + all `/dashboard`,`/gear/*`,`/admin`,`/onboarding` | No | exclude via `robots.ts` (don't add metadata) |

## Analytics & Monitoring (Ops)

- **OPS-1 — Zero conversion-event tracking (HIGH).** Only `@vercel/analytics` pageviews (`layout.tsx:39`). No `track()`/gtag/PostHog anywhere — **none** of signup, recommendation-generated, affiliate-click, comparison, or credit-purchase is instrumented. The entire business case rests on measuring affiliate conversion and pack-purchase rate; without events you can't compute conversion, attribute revenue, or validate recommendation→click. **Data lost at launch is unrecoverable.** **Fix:** `import { track } from '@vercel/analytics'` and fire at: signup complete, `/api/recommend` success, `AffiliateButton` click (DB log exists in `affiliate_clicks` — good for owned data, not funnel analytics), comparison run, Stripe `checkout.session.completed`. PostHog if you want full funnels. **Effort:** S–M.
- **OPS-2 — No error monitoring (HIGH).** No Sentry/Datadog; logging is `console.error` only. The Stripe webhook (`stripe/webhook/route.ts:60`) logs an `add_credits` failure to console but **nothing alerts you** → a user paid and silently got no credits (chargeback/churn on the only paid mechanic). The recommend engine's JSON-parse path is also high-failure. **Fix:** add `@sentry/nextjs`; at minimum replace the webhook `console.error` with a Sentry capture or a Resend ops-alert email on credit-grant failure. **Effort:** S.
- **OPS-3 — `validateEnv()` never called (MEDIUM).** See [ENG-4](./LAUNCH_AUDIT_ENGINEERING.md). Add `instrumentation.ts` → `register()` → `validateEnv()` so missing prod env vars fail at boot, not mid-flow.
- **Env separation good:** `lib/env.ts` correctly separates server vs `NEXT_PUBLIC_`; matches CLAUDE.md secret rules. Gap is purely that it's never invoked.

---

## Customer-Acquisition Roadmap (Pass 7 content)

### First 10 conversion-oriented pages (all map to live categories; each ends in a personalized-rec CTA)
| # | Page | Keyword theme | Intent | Priority | Difficulty |
|---|---|---|---|---|---|
| 1 | Best triathlon wetsuit for beginners | beginner wetsuit | high buy | High | Med |
| 2 | Best GPS watch for Ironman / long course | long-course watch | high buy | High | Med (extend existing guide) |
| 3 | Best running shoes for triathletes / brick runs | tri running shoes | high buy | High | Med |
| 4 | Best race nutrition for a sensitive stomach (GI) | GI-friendly fuel | high buy | High | Low (you have GI-tolerance scores — differentiated) |
| 5 | Garmin vs Apple Watch for triathlon | brand comparison | comparison | High | Med |
| 6 | Wetsuit fit guide: how it should feel | wetsuit fit | informational→trust | Med | Low |
| 7 | High-caffeine vs caffeine-free race fuel | caffeine strategy | mid | Med | Low (data-backed) |
| 8 | Best budget triathlon wetsuit under $300 | budget wetsuit | price | Med | Low |
| 9 | Carbon-plate super-shoes: worth it for age-groupers? | super shoe value | opinion+data | Med | Med |
| 10 | Programmatic "[brand] [model] review for your profile" template | long-tail product | long-tail buy | Med | scales across catalog; indexable summary + signup CTA |

**Why they convert:** each targets a mid-decision buyer and ends where listicles can't — a personalized recommendation. The GI-tolerance and caffeine angles are uniquely yours because `product_review_mentions` actually scores those dimensions.

**Content trust to add:** methodology/"how we source reviews" page (also closes [LEG-2](./LAUNCH_AUDIT_SECURITY_LEGAL.md) and the trust gap), author/last-updated dates, sources/citations (already per-recommendation), editorial/affiliate disclosure (present).

**Internal linking:** guide → relevant category questionnaire → signup; cross-link guides within a sport cluster. Keep `/guides/*` + marketing SSR'd and crawlable; keep the app auth-walled (effectively noindex) and excluded via `robots.ts`.

**Schema:** `Article` + `ItemList`/`Product` on guides; `FAQPage` on FAQ; `BreadcrumbList` as category/guide depth grows.
