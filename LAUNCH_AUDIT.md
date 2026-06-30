# Tapr — Pre-Launch Audit (Master)

**Date:** 2026-06-16 · **Reviewer:** Claude Code (lead) + focused subagents (accessibility, design/UX, performance/SEO/ops)
**Scope:** `/Users/jonathanromeo/Desktop/Tapr/tapr` (Next.js app; git root is here, not the parent folder)
**Method:** direct inspection of routes, API handlers, the AI engine, components, config, and a production build. This master file is the summary; full evidence is in the linked detail files.

### Detail files
- [Engineering (Pass 1 + AI engine)](./LAUNCH_AUDIT_ENGINEERING.md)
- [Security + Privacy/Legal (Pass 2–3)](./LAUNCH_AUDIT_SECURITY_LEGAL.md)
- [Design/UX + Accessibility + Product (Pass 4, 5, 10)](./LAUNCH_AUDIT_DESIGN_UX.md)
- [Performance + SEO + Analytics/Ops + Growth (Pass 6, 7, 8)](./LAUNCH_AUDIT_SEO_GROWTH.md)
- [QA Test Plan (Pass 9)](./LAUNCH_AUDIT_QA.md)

> **Coverage note / correction:** an earlier short version of this file claimed onboarding was missing the affiliate disclosure. That was wrong — the disclosure IS present (`OnboardingWizard.tsx:984`); I had grepped the wrong file. Corrected below. This version covers all 10 passes.

---

## 1. Executive Summary

**Launch decision: SHIP AFTER SPECIFIC FIXES.**

The engineering and security foundation is genuinely strong — auth, affiliate-URL secrecy, Stripe webhook security, zod validation on most routes, no IDOR, and a thorough privacy policy are all done right. This is not a fragile or unsafe codebase. What's blocking a clean launch is a cluster of mostly-cheap items, and one theme stands out: **the credit system — the paid mechanic — is half-wired.** Two spec'd components (`CreditGate`, `CreditBalance`) are dead code, so users can't see their balance and 0-credit users dead-end after completing the whole questionnaire. Combined with the missing refund-on-failure, the revenue mechanic is the riskiest surface.

**Top findings (most important first):**
1. **[FIXED] Production build was broken** — 4 lint errors failed `next build`; Vercel couldn't deploy. Fixed in this audit; build now passes (34 routes).
2. **0-credit users hit a dead-end** after the full questionnaire — `CreditGate` is dead code; the 402 error has no buy CTA. Violates "never a dead end." ([UX-2](./LAUNCH_AUDIT_DESIGN_UX.md))
3. **Credit balance is never shown** anywhere — `CreditBalance` is dead code. Violates a CLAUDE.md rule and suppresses pack purchases. ([UX-1](./LAUNCH_AUDIT_DESIGN_UX.md))
4. **Credit lost on any AI/parse/empty-result failure, never refunded** — systemic across `recommend` + `compare` (up to 2 credits). ([ENG-1](./LAUNCH_AUDIT_ENGINEERING.md))
5. **Homepage `/` is still the pre-launch waitlist** (no signup path); the finished landing is at `/launch`. Launch-day cutover required. ([UX/waitlist](./LAUNCH_AUDIT_DESIGN_UX.md))
6. **Running Shoes shown "Coming Soon" on the landing** but live per DB/CLAUDE.md — factual contradiction to resolve. ([UX-3](./LAUNCH_AUDIT_DESIGN_UX.md))
7. **Zero conversion analytics** — only pageviews; signup/recommendation/affiliate-click/purchase are untracked. Launch data is unrecoverable. ([OPS-1](./LAUNCH_AUDIT_SEO_GROWTH.md))
8. **No error monitoring / webhook failure alert** — a paid-but-no-credits webhook failure is silent. ([OPS-2](./LAUNCH_AUDIT_SEO_GROWTH.md))
9. **No sitemap/robots/OG tags** — caps SEO and makes shared links render bare, for an affiliate/SEO business. ([SEO-1/2](./LAUNCH_AUDIT_SEO_GROWTH.md))
10. **No rate limiting on public email endpoints** — reset-password/contact email-bombing + Resend cost. ([SEC-1](./LAUNCH_AUDIT_SECURITY_LEGAL.md))

**Changes actually made during this audit (low-risk, mechanical — to unblock the build):**
- `recommendation/page.tsx:10` — removed dead `RecommendationFeedback` import.
- `questionnaire/page.tsx:7` — removed unused `RACE_DISTANCES_BY_SPORT`, `type Sport`.
- `recommend/route.ts:40` — `let debugBundle` → `const`.
- Result: `npm run build` now compiles + generates all 34 routes.

**Changes recommended but NOT made:** everything else below (credit wiring/refund, homepage swap, validation, analytics, headers, rate limiting, SEO assets). All touch product/payment/legal logic and are documented for your decision.

---

## 2. Master Prioritized Findings

| Pri | Sev | Area | Finding | Evidence | Fix | Effort | Block? |
|---|---|---|---|---|---|---|---|
| 1 | Critical | Eng | Build failed `next build` (**FIXED**) | `next.config.mjs`; 3 files | done | XS | was Yes |
| 2 | Critical | UX/Product | 0-credit user dead-ends after questionnaire; `CreditGate` unused | `recommendation/page.tsx:210`; `CreditGate.tsx` | gate entry + inline buy on 402 | M | Yes |
| 3 | High | UX/Product | Credit balance shown nowhere; `CreditBalance` unused | `CompactHeader.tsx`; `CreditBalance.tsx` | render in header+dashboard | S | Yes |
| 4 | High | Eng/Pay | Credit not refunded on AI/parse/empty failure (systemic) | `recommend/route.ts:55+`; `compare/route.ts:96+` | refund on every post-deduct failure | S | Strongly rec |
| 5 | Critical(go-live) | Product | Homepage is waitlist; no signup path | `(marketing)/page.tsx` vs `launch/page.tsx` | swap `/` on launch day | XS | Yes |
| 6 | High | Product/Content | Running Shoes "Coming Soon" vs live in DB | `launch/page.tsx:57,195,216` | reconcile source-of-truth | XS | Yes |
| 7 | High | Analytics | No conversion events tracked | `layout.tsx:39` only | add `track()` at funnel steps | S–M | Rec before traffic |
| 8 | High | Ops | No error monitoring / silent webhook failure | `stripe/webhook/route.ts:60` | Sentry + webhook alert | S | Rec |
| 9 | High | SEO | No sitemap/robots/OG/canonical | `app/` (absent); `layout.tsx:25` | add robots/sitemap/OG | S | Rec |
| 10 | High | Security | No rate limit on public email endpoints | `contact`, `notify`, `reset-password` | IP ratelimit + honeypot | S–M | Rec |
| 11 | High | Eng/Sec | `/api/profile` PATCH has no validation | `profile/route.ts:44` | zod schema + length caps | S | Rec |
| 12 | High | UX | Onboarding 15–16 steps vs "3-min" claim | `OnboardingWizard.tsx:773` | trim to essentials | M | No |
| 13 | High | UX/Trust | No testimonials/methodology/About page | `launch/page.tsx`; none found | add trust + methodology page | M | No |
| 14 | High | A11y | Auth form labels unassociated; errors not announced | `login/signup/reset` | `htmlFor`/`id` + `role=alert` | XS–S | Yes (auth) |
| 15 | High | A11y | Modals/drawers don't trap/move focus | 5 overlays | Radix Dialog / focus-trap | M | Borderline |
| 16 | Med | Legal | Health/allergen disclaimer only in Terms | `terms:60`; nutrition live | result-adjacent disclaimer | XS | No |
| 17 | Med | Perf/SEO | `force-dynamic` on static homepage | `(marketing)/page.tsx:5` | remove line | XS | No |
| 18 | Med | Ops | `validateEnv()` never called | `lib/env.ts:16` | `instrumentation.ts` | XS | No |
| 19 | Med | Eng/Sec | `?debug=1` writes prompt/profile to `/tmp` | `recommend/route.ts:443` | gate behind admin/env | XS | No |
| 20 | Med | Sec | Prompt injection via free-text | `lib/anthropic.ts:120` | delimiters + caps | S | No |
| 21 | Med | Sec | No security headers | `next.config.mjs` empty | `headers()` block | S | No |
| 22 | Med | A11y | Custom dropdown + questionnaire selects lack ARIA | `ProductPickerDropdown`, `questionnaire` | roles + Escape | M | No |
| 23 | Med | A11y | No `prefers-reduced-motion` | `globals.css` | one media block | XS | No |
| 24 | Med | UX | Non-functional pricing table; no proactive billing nav | `launch:283`; header | restructure | S | No |
| 25 | Low | Eng | Model id inconsistency 4-5 vs 4-6 | `recommend:175`/`compare:181` | centralize | XS | No |
| 26 | Low | Eng | `as any` on JSON columns; dead skeleton; `CompareView` stub | various | type/cleanup | S | No |
| 27 | Med | SEO | No JSON-LD on guide | `guides/...page.tsx` | Article/ItemList | S | No |

Severity rubric per the FINAL CHECK doc (Critical=block, High=fix if possible, Medium=ship if understood, Low=polish).

---

## 3. Launch Decision

**Ship after specific fixes.** The product is well-built and safe to operate; it is not launch-ready *as a paid product* until the credit mechanic is fully wired (items 2–4) and the homepage is swapped (5). Everything else is High/Medium polish that should follow quickly but doesn't gate a careful soft launch.

---

## 4. 48-Hour Pre-Launch Action Plan
1. **Wire the credit UX** (items 2–4): render `CreditBalance` in the header + dashboard; gate questionnaire entry with `CreditGate`; replace the 402 error with an inline buy-pack block; add refund-on-failure in `recommend` + `compare`. *(The components already exist — this is wiring, not building.)*
2. **Homepage cutover** (5): swap `/` to the `launch/page.tsx` content; confirm `/signup` + `/login` CTAs; remove `force-dynamic` (17).
3. **Reconcile Running Shoes** (6): set the landing copy/badge to match the DB source-of-truth; fix the "Three categories" count.
4. **Verify the manual blockers** (§6): RLS on every user-owned table; `add_credits` idempotency; Stripe live keys + prod webhook; Resend domain.
5. **A11y quick wins** (14, 23): auth `htmlFor`/`id` + `role="alert"`; reduced-motion block. Add minimum Escape+initial-focus to drawers/modals (15).
6. **Add zod to `/api/profile`** (11) and gate `?debug=1` (19).

## 5. 30-Day Post-Launch Plan
- **Week 1:** conversion-event instrumentation (7) + Sentry + webhook failure alert (8); `robots.ts`/`sitemap.ts`/OG tags (9); rate limiting on public email endpoints (10).
- **Week 2:** methodology/About/trust page + minimal social proof (13); nutrition allergen disclaimer (16); security headers (21); `validateEnv` at boot (18).
- **Week 3:** trim onboarding to essentials (12); finish Compare-dropdown + questionnaire ARIA semantics (22); JSON-LD on the guide (27); ship the first 3 SEO pages ([roadmap](./LAUNCH_AUDIT_SEO_GROWTH.md)).
- **Week 4:** prompt-injection hardening (20); type the JSON-column routes (26); add a CI gate (`next build` + smoke E2E) so the broken-build class can't recur; build out SEO pages 4–10.
- **Monitor:** Claude JSON parse-failure rate (drives refunds), credit-grant vs Stripe-payment reconciliation, waitlist/contact spam volume, affiliate click→conversion.

---

## 6. <a name="manual"></a>Missing Information / Manual Checks (cannot verify from code)
1. **Supabase RLS** on `athlete_profiles`, `gear_recommendations`, `category_responses`, `user_credits`, `affiliate_clicks`, `gear_comparisons`, `product_corrections` — must restrict rows to `auth.uid()`. The code is correctly scoped, but RLS itself is the backstop. **Verify in the dashboard.**
2. **`deduct_credits` / `add_credits` RPCs** — confirm `SECURITY DEFINER`, race-safe (row lock), and `add_credits` dedupes on `p_stripe_session_id` (else webhook retries double-grant).
3. **Stripe** live-mode keys + production webhook endpoint/secret (`project-stripe-go-live`).
4. **Resend** domain verification for `taprai.com` (`project-resend-setup`) — emails silently fail otherwise.
5. **Vercel prod env vars** all set (and `validateEnv` wired to catch misses — item 18).
6. **Domain consistency** — footer says "Taprai, LLC"; confirm `taprai.com` everywhere (`project-domain-and-branding`).
7. Real device/browser testing per [QA matrix](./LAUNCH_AUDIT_QA.md).

---

## 7. Tell-the-Founder Summary
- **Most likely to break:** the credit system. Right now a returning user with 0 credits can answer your entire questionnaire and hit a dead-end with no way to pay, users can't even see their balance, and anyone who hits an AI hiccup loses a credit with no refund. Wire the two existing components in and add the refund — that's the launch.
- **Most likely to hurt conversion:** your front door is still a waitlist with no signup, you advertise a live category (running shoes) as "coming soon," and shared links have no preview image. Plus there's no trust/methodology page to answer "why trust an AI over Wirecutter?"
- **Most likely legal/security risk:** no rate limiting on email endpoints (cheap abuse vector), nutrition/allergen advice with the disclaimer buried in Terms, and unverified RLS. None catastrophic; all cheap.
- **Do first:** wire the credit UX, swap the homepage, fix the running-shoes copy, verify RLS + `add_credits` idempotency. Then instrument analytics before you send a single paid visitor — that data doesn't come back.
