# Tapr Pre-Launch Smoke Test

Run before the **June 30** launch. Structure adapted from a council (Perplexity) plan, corrected to Tapr's actual implementation. Work top-to-bottom; **Section A must fully pass or do not launch.**

**Real names to verify against (not generic):**
- Credit tables: `user_credits` (balance: `credits_remaining`) + `credit_transactions` (ledger: every `+`/`-` with `reason`, `stripe_session_id`).
- Credit RPCs: `deduct_credits` (atomic, `FOR UPDATE` row lock), `add_credits` (idempotent on `stripe_session_id`).
- Profile: `athlete_profiles`. Recommendations: `gear_recommendations` + `category_responses`. Comparisons: `gear_comparisons`. Clicks: `affiliate_clicks`. Waitlist: `waitlist_signups`. Category interest: `category_notify`.
- Key routes: `/api/recommend`, `/api/compare`, `/api/affiliate/click`, `/api/stripe/webhook`, `/api/contact`, `/api/notify`, `/api/category-notify`, `/api/auth/reset-password`.

> ⚠️ **Two features are env-gated and CANNOT be tested in local dev:**
> - **Rate limiting** no-ops unless `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set → test on a Vercel deploy.
> - **Sentry** is `enabled` only when `NODE_ENV==='production'` → test on prod/preview, not `npm run dev`.

---

## A. Critical path — must pass or DO NOT LAUNCH (P0)

### Auth & onboarding
- [ ] **A1 — Signup grants 3 credits.** New email → signup → (verify email or auto-confirm) → logged in. Header shows **3 credits**. DB: `auth.users` row + `user_credits.credits_remaining = 3`; no `athlete_profiles` row yet.
- [ ] **A2 — Login / logout / protected routes.** Logged out, hit `/dashboard` directly → redirected to `/login`. Log in → loads. Log out → header anonymous, protected route redirects again. (Middleware uses `supabase.auth.getUser()`.)
- [ ] **A3 — Onboarding completes & persists.** Finish the full wizard → lands on dashboard. Reload → not re-shown. DB: one `athlete_profiles` row for the user with fields populated.

### Credits & recommendations (HIGHEST RISK)
- [ ] **A4 — Credit deducts once, before the AI call.** With 3 credits, run one recommendation. Balance → 2. DB: exactly one `credit_transactions` row `amount = -1, reason = 'recommendation'`. Refresh mid-stream does NOT double-deduct.
- [ ] **A5 — Valid recommendation in EACH live category** (different engines): **Wetsuits, GPS Watches, Running Shoes, Nutrition**. Each streams, renders a top pick + runner-up, no JSON error surfaces. (Confirms `buildRecommendationPrompt` / `buildNutritionPrompt` / `buildRunningShoePrompt` all parse.)
- [ ] **A6 — Refund on failure (deliberate).** As the **admin user**, force a failure (temporarily stub a malformed parse, or empty product set). Expect: error shown, **credit returned**. DB ledger: `-1` then `+1` (`reason = 'refund_recommendation'`), net zero. Sentry (prod) logs it. *This is the corrected pattern — deduct→stream→refund-on-failure, not one wrapping transaction.*
- [ ] **A7 — Zero-credit gate, no dead end.** Drain to 0 credits. Start a recommendation → blocked **before** the questionnaire with an inline buy-pack prompt (3/$2.99, 10/$8.99, 25/$17.99). No questionnaire, no 402 dead-end error.

### Compare
- [ ] **A8 — Compare cost + hard cap.** 2 products = 1 credit; 3–4 = 2 credits; selecting a 5th is rejected server-side (`/api/compare` caps at 4). DB ledger shows correct deduction.
- [ ] **A8b — Quick-compare is FREE.** From a recommendation, compare its top pick + one other → **0 credits** deducted (the quick-compare path). *(Council missed this — verify it.)*

### Payments (HIGHEST RISK — Stripe TEST mode)
- [ ] **A9 — Pack purchase → credits granted.** Buy each pack (3/10/25) with a Stripe test card → balance increases by pack size. DB: `credit_transactions` row with the `stripe_session_id`, `reason = 'pack_N'`.
- [ ] **A10 — Webhook idempotency (deliberate replay).** In Stripe dashboard, **resend** the same `checkout.session.completed` event. Expect: **no second grant**, balance unchanged. (Backed by the partial unique index on `credit_transactions.stripe_session_id` + `ON CONFLICT DO NOTHING`.)
- [ ] **A11 — Grant-failure alert.** Temporarily break the grant (e.g. bad RPC) on a test event → founder gets a Resend email + Sentry event; webhook returns 500 (Stripe will retry).

### Affiliate, admin, public
- [ ] **A12 — Affiliate link safety.** Click a Shop link → new tab opens; **raw `affiliate_url` never appears** in DOM, React props, or the `/api/affiliate/click` response body (only `redirectUrl` is returned). `affiliate_clicks` row written. `affiliate_click` analytics event fires.
- [ ] **A13 — Admin lockout.** As a normal user, hit `/admin/products` via URL AND call `/api/admin/products` directly → 403. As `ADMIN_USER_ID` → loads.
- [ ] **A14 — Coming-soon categories** (goggles, tri-suits, bikes, accessories) show the email-capture card, not a blank page. Submit → `category_notify` row.
- [ ] **A15 — Homepage flip (June 30).** After the manual swap, `/` renders the **live landing** (signup CTA), not the waitlist. `force-dynamic` removed from `app/(marketing)/page.tsx`. *(No feature flag — it's a code change.)*
- [ ] **A16 — 404 / error pages.** Unknown route → friendly `not-found`. No raw stack traces to users.

---

## B. Edge cases (P1, pre-launch)

- [ ] **B1 — Duplicate signup** with an existing email → clear error, no second account, no extra credits.
- [ ] **B2 — Password reset end-to-end** → email link works once, new password logs in, old fails.
- [ ] **B3 — Refresh mid-onboarding LOSES progress** (no incremental save — saves only on final submit). Confirm this is acceptable for launch or note it. *(Known gap.)*
- [ ] **B4 — Network drop mid-stream** → UI shows error/incomplete; credit state stays consistent (refund fired if server didn't finish). Check header + ledger.
- [ ] **B5 — Double-click "Generate"** → no double deduction.
- [ ] **B6 — Abandoned checkout** (close tab) → no grant, balance unchanged, Stripe shows incomplete session.
- [ ] **B7 — Rate-limit boundary (ON A DEPLOY).** From one IP, exceed a limit (e.g. 6+ contact submits, limit 5/hr) → 429 with friendly message; other endpoints still work. Upstash dashboard shows counters. *(No-op locally — must be a deploy with Upstash keys.)*
- [ ] **B8 — Long / special-char / emoji** in profile + questionnaire free-text → saves, AI handles it (also exercises the profile zod validation + prompt-injection system prompt).
- [ ] **B9 — Stale "June 30" copy** — after launch, no page still says "launching soon" / waitlist where it shouldn't.

---

## C. Role-based

- [ ] **C1 — Anonymous:** sees marketing, `/how-it-works`, guide, coming-soon, contact/waitlist forms. Cannot reach `/dashboard`, `/gear/*`, `/admin`.
- [ ] **C2 — Free-credit user:** 3 recs succeed, 4th hits the zero-credit gate.
- [ ] **C3 — Zero-credit user:** buys a pack (test mode) → credits restored → consumes → gates again.
- [ ] **C4 — Admin:** `/admin/*` loads; one admin action works; non-admins proven blocked (C1/A13).

---

## D. Cross-browser & mobile matrix

Run signup → onboarding → 1 recommendation → 1 affiliate click → 1 email form → Stripe test purchase on each:

| Environment | Focus |
|---|---|
| Chrome desktop | Full P0; streaming, Stripe, compare |
| Safari desktop | Streaming, Stripe, **modal focus-trap + Escape** |
| Firefox desktop | Streaming, onboarding, rate-limit 429 |
| iOS Safari | Signup/login, wizard, **44px touch targets** |
| Android Chrome | Signup/login, recommendation, buy credits, nav drawer |

- [ ] **D-a11y** — with OS "reduce motion" on, animations are suppressed (`prefers-reduced-motion`). Keyboard-only: focus stays trapped in modals/nav drawer, Escape closes, focus returns to trigger. Screen reader announces option-button selected state (`aria-pressed`) and form errors (`role="alert"`).

---

## E. Pre-launch infra / config (P0 — mostly outside the app)

- [x] **E1 — DB security advisor (run 2026-06-26).** 🚨 CRITICAL FOUND + FIXED: credit/usage SECURITY DEFINER functions were callable by `anon`/`authenticated` via public REST RPC (anyone could mint/drain credits). Revoked from PUBLIC, granted to `service_role` only; pinned search_path. Verified. Remaining (lower priority): always-true INSERT RLS on `affiliate_clicks` + `category_notify` (spam vector — tighten post-launch); leaked-password protection disabled (enable in Auth settings). STILL TODO: manually attempt a cross-user read via direct REST call to confirm per-table RLS on `athlete_profiles`/`user_credits`/etc.
- [ ] **E2 — Vercel prod env vars** all set: Supabase, `ANTHROPIC_API_KEY`, Stripe **LIVE** keys + `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, **`UPSTASH_REDIS_REST_URL` + `_TOKEN`**, **`NEXT_PUBLIC_SENTRY_DSN`**, `ADMIN_USER_ID`. No test keys in prod. (`validateEnv()` runs at boot via `instrumentation.ts` — a missing one fails the deploy.)
  - [ ] **⚠️ `NEXT_PUBLIC_APP_URL` MUST be the production domain** (`https://www.taprai.com`), NOT localhost. Verified locally the code is correct, but local `.env.local` = `http://localhost:3000`. If Vercel has it wrong/unset, the **sitemap, robots `Sitemap:` pointer, and all OG/Twitter image+url tags point to localhost** → Google can't crawl + social shares show broken images.
- [ ] **E3 — Stripe TEST vs LIVE** have separate webhook endpoints + signing secrets, subscribed to `checkout.session.completed`. Live endpoint returns 200 on a test ping.
- [ ] **E4 — Resend** domain (`taprai.com`) verified; FROM correct; signup / reset / contact / founder-alert emails deliver (check Gmail/Outlook/iCloud + spam, DKIM/SPF).
- [ ] **E5 — Sentry** receiving: trigger a controlled error on a deploy → event appears with `environment=production`.
- [ ] **E6 — Supabase project ACTIVE** (not paused). Free tier pauses after 7 days idle — don't let it sit untouched pre-launch.
- [x] **E7 — SEO artifacts (verified 2026-06-26, local prod server).** robots.txt correct (allows /, disallows app routes, sitemap pointer); sitemap.xml lists /, /how-it-works, guide, /privacy, /terms, /contact; OG + Twitter tags present on landing; /how-it-works + guide → 200; guide JSON-LD present. ✅ Code correct. ⚠️ All URLs render from `NEXT_PUBLIC_APP_URL` — re-verify on the real deploy once E2's APP_URL is set to the prod domain.
- [x] **E8 — No secrets in client bundle (verified 2026-06-26).** ✅ Service-role key, Stripe secret, Anthropic key, webhook secret, Upstash token all ABSENT from `.next/static`. `affiliate_url` appears only in the admin-products chunk (field name, no URL values); non-admin bundle ships 0 real affiliate links. (Known/accepted deferred item.)

---

## F. Post-launch — watch first 48h

- [ ] **F1 — Stripe:** checkout-started vs `completed`, webhook error rate, refunds. **Pause marketing if** webhook failures climb or credits ≠ payments.
- [ ] **F2 — Recommendations:** failure-to-total ratio, time-to-first-token, **refund rate** (spikes = AI/parse problems). Watch `[recommend] REFUND FAILED` logs.
- [ ] **F3 — Rate limits:** Upstash 429 volume — if legit users get blocked (shared IPs), raise limits.
- [ ] **F4 — Sentry:** new P0 errors in auth, profile save, recommend, webhook, affiliate redirect.
- [ ] **F5 — Vercel:** 500/504 rate, TTFB; Supabase CPU/connections.
- [ ] **F6 — Funnel:** sign_up → profile → first recommendation → affiliate_click → credit_purchase drop-off.
- [ ] **F7 — LIVE-MONEY finance test (do shortly AFTER going live).** With Stripe in LIVE mode, buy the smallest pack ($2.99) with a real card from your own account. Verify the full chain end-to-end: charge appears in Stripe → `checkout.session.completed` webhook delivers 200 → `credit_transactions` row written with the live `stripe_session_id` → `user_credits` balance increased → no founder/Sentry alert fired. Then **replay that live event once** from the Stripe dashboard and confirm it does NOT double-grant. Optionally refund the charge afterward. *(The test-mode runs in Section A verify the logic; this confirms the real money rails before relying on them.)*

---

## Highest-risk areas — test these deliberately
1. **Money/credits:** A6 (refund), A9–A11 (grant + idempotency + alert). Replay a webhook; force a parse failure. These were verified structurally but **not with live money** — do them for real in test mode.
2. **AI streaming/JSON:** A5 across all 4 engines; B4 (network drop); B8 (hostile free-text).
3. **Webhook idempotency:** A10 replay.
4. **Rate-limit false positives:** B7 on a deploy; consider higher limits for shared-IP traffic.

## Automate later (Playwright/Cypress + API tests)
A1–A10, B7, role gates (C), homepage flip (A15), SEO presence (E7). Prioritize the money paths.

## Council "things you forgot" worth a glance
404/500 UX (A16) · log hygiene (no PII/cards in logs) · Supabase backups enabled · graceful "temporarily unavailable" if Anthropic/Stripe down (don't charge a credit) · legal/affiliate disclosure visible near recommendations.
