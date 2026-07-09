# Launch Audit — Progress Tracker

Single source of truth for working through [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md). Cadence: **per-item, with diffs** — nothing in the 🟠 class is applied without an approved diff.

**Class:** 🔵 decision (founder only) · 🟢 safe-mechanical (apply → review) · 🟠 review-required (diff → approve → apply)
**Status:** `todo · decision-needed · approved · in-progress · done · deferred · won't-do`

## Decisions (Phase 0 — RESOLVED)
| ID | Decision | Status | Outcome |
|---|---|---|---|
| D1 | Running Shoes live? | ✅ resolved | DB confirms LIVE (177 active products). → landing copy fix. |
| D2 | Homepage cutover | ✅ resolved | **Target launch June 30, 2026.** Keep waitlist on `/` until then. Items 5, 17 scheduled for June 30. |
| D3 | Onboarding trim | ✅ deferred | Combine/streamline questions to shorten WITHOUT losing recommendation data depth. Logged in `product-ops/post-launch-backlog.md`. Item 12 deferred. |
| D4 | Credit refund + expiry copy | ✅ approved | "Credits never expire. Credit-pack purchases are non-refundable." Add to Terms + billing. |
| D5 | Tooling spend | ✅ approved | Vercel `track()` (free) for conversion events + Sentry free tier for errors. No PostHog yet. Items 7, 8 unblocked. |

## Fix items
| ID | Class | Sev | Item | Status | Detail |
|---|---|---|---|---|---|
| 1 | 🟢 | Crit | Build broken (lint) | ✅ done | Fixed in audit; build green |
| 2 | 🟠 | Crit | 0-credit dead-end (wire `CreditGate`) | ✅ done | new `StartRecommendationButton` gates both category-page CTAs; 0-credit → inline buy-pack prompt; build green |
| 3 | 🟠 | High | Credit balance hidden (wire `CreditBalance`) | ✅ done | `CreditBalance` wired into `CompactHeader` + dashboard hero; build green |
| 4 | 🟠 | High | Credit refund-on-failure | ✅ done | recommend (6 paths) + compare (7 paths) refund via `add_credits`; build green; ledger nets to 0 |
| 28 | 🟠 | High | `add_credits` idempotency (dedupe Stripe session) | ✅ done | migration applied: partial unique index + ON CONFLICT/rowcount guard; verified structurally; live test deferred to Stripe test-mode QA |
| 5 | 🟠 | Crit | Homepage waitlist → live swap | scheduled: Jun 30 | DESIGN_UX |
| 6 | 🟠 | High | Running Shoes "Coming Soon" copy | ✅ done | launch page: badge + active grid + "Four categories" heading |
| 7 | 🟠 | High | Conversion analytics (Vercel `track`) | ✅ done | 4 events: sign_up, recommendation_generated, affiliate_click, credit_purchase; build green. ⚠️ comparison_run NOT instrumented (deferred — lowest-volume); no PII in any event |
| 8a | 🟠 | High | Webhook failure alert (paid-but-no-credits) | ✅ done | `lib/alert.ts` → founder email on add_credits failure; build green |
| 8b | 🟠 | High | Sentry error monitoring | ✅ done | server/edge/client configs + onRequestError + global-error.tsx + webhook captureException; no-op without DSN; `enabled` in prod only; build green. ⚠️ ADD NEXT_PUBLIC_SENTRY_DSN TO VERCEL; verify a test event post-deploy |
| 9 | 🟢 | High | sitemap/robots/OG | ✅ done | `app/robots.ts` + `app/sitemap.ts` (both build as static); OG+Twitter+metadataBase in root layout. Avoided global-canonical footgun. TODO: purpose-built 1200×630 OG image (interim = logo 720×345); per-page canonicals optional |
| 10 | 🟠 | High | Rate limit public email endpoints | ✅ done | Upstash + `lib/ratelimit.ts` (graceful fallback); wired into contact/category-notify/notify/reset-password; enforcement verified live (5/7); build green. ⚠️ ADD UPSTASH ENV VARS TO VERCEL before launch |
| 11 | 🟠 | High | `/api/profile` zod validation | ✅ done | schema in `lib/validation/athleteProfile.ts`; strips unknown cols; verified 10/10 vs real payloads + build green. CORRECTION: onboarding `actions.ts` is ALSO already zod-validated (full schema + explicit field mapping) — earlier "unvalidated" note was wrong (verified 2026-07-09). No gap. |
| 12 | 🟠 | High | Trim onboarding | deferred → backlog | DESIGN_UX UX-4 |
| 13 | 🟠 | High | Trust/methodology/About page | ✅ done | `/how-it-works` published: founder-approved copy w/ real Tier-1 source examples + credit-pack disclosure; linked as "Methodology" in both marketing footers + dashboard layout + NavSidebar; added to sitemap; build green |
| 14 | 🟠 | High | Auth a11y: labels + role=alert | ✅ done | login/signup/reset: htmlFor/id on all inputs + role="alert" on errors; also fixed stale "3 recs/day" → "3 free credits"; build green |
| 15 | 🟠 | High | Modal/drawer focus trap | ✅ done | shared `useFocusTrap` hook → 3 content modals + 2 nav drawers (focus in/trap/restore, Escape, role=dialog, aria-hidden backdrop); build green |
| 25 | 🟢 | Low | Model-id constant | ✅ done | `TAPR_MODEL='claude-sonnet-4-6'` both routes (compare moved 4-5→4-6 — flag for smoke test) |
| 27 | 🟢 | Med | JSON-LD on guide | ✅ done | Article schema + per-page canonical on GPS-watch guide; build green |
| 16 | 🟠 | Med | Nutrition allergen disclaimer | ✅ done | result-adjacent band on recommendation page, shown only for category === 'nutrition'; build green |
| 17 | 🟢 | Med | Remove `force-dynamic` from `/` | scheduled: Jun 30 | SEO_GROWTH PERF-1 (do with homepage swap) |
| 18 | 🟢 | Med | Wire `validateEnv()` at boot | ✅ done | `instrumentation.ts` register() → validateEnv() (nodejs runtime); fails fast on missing prod env; build green |
| 19 | 🟢 | Med | Gate `?debug=1` | ✅ done | moved after auth; now requires `user.id === ADMIN_USER_ID`; build green |
| 20 | 🟠 | Med | Prompt-injection hardening | ✅ done | `TAPR_SYSTEM_PROMPT` system param on both calls; trusted/untrusted split; build green. TODO: manual per-category spot-check before June 30 |
| 21 | 🟢 | Med | Security headers | ✅ done | HSTS + nosniff + X-Frame-Options DENY + Referrer-Policy + Permissions-Policy + DNS-prefetch on all routes; verified live via curl. Strict CSP deferred (needs allowlist+testing). |
| 30 | 🟠 | Med | Incomplete-result guards (smoke-test) | ✅ done | ComparisonResultCard + useRecommendation guard partial/timed-out results → clean "try again" instead of white-screen crash; ConfidenceBadge config fallback |
| 22a | 🟠 | Med | Dropdown ARIA (low-risk half) | ✅ done | ProductPickerDropdown: aria-expanded/haspopup + Escape + Space-on-clear; TopNav account menu: aria-expanded/haspopup + Escape + aria-hidden catcher. (No listbox roles — would imply arrow-key nav not implemented) |
| 22b | 🟠 | Med | Questionnaire selection ARIA | ✅ done | `aria-pressed` added to ALL shared input widgets: SingleSelect, MultiSelect, AND BrandSentimentPicker (3 toggle buttons). Centralized in shared components → covers all categories. CLAUDE.md #26 documents the maintenance rule for future custom widgets. ⚠️ NOTE: BrandSentimentPicker is PRE-EXISTING uncommitted work not authored here — founder to confirm before committing |
| 24 | 🟠 | Med | Pricing table + billing nav | ✅ done | launch page Pricing restructured (Free hero, credit-math once, compact paid strip); billing nav already covered by item 3 header CreditBalance |
| 26 | 🟢 | Low | Polish: dead skeleton / CompareView stub | ✅ done | deleted dead `CompareView.tsx` (latent-bug stub); left `_RecommendationSkeleton` parked for founder's spinner→skeleton call. JSON-column types remain in post-launch-backlog |
| 23 | 🟢 | Med | `prefers-reduced-motion` | ✅ done | global media block in globals.css neutralizes animations/transitions; build green |
| 29 | 🟠 | High | Metric/imperial unit toggle (weight/height/all measurements) | deferred → backlog | NEW finding from item-11 review; data-integrity risk (kg-as-lbs); ~1 day; post-launch |

## Manual verification (founder, outside code — see LAUNCH_AUDIT.md §6)
- [x] `deduct_credits` race-safety + ledger — ✅ confirmed: `SECURITY DEFINER`, `FOR UPDATE` row lock, writes `credit_transactions`
- [x] `add_credits` idempotency — ❌ confirmed NOT idempotent → became fix item 28
- [x] **🚨 CRITICAL (found during smoke test, FIXED 2026-06-26):** credit/usage SECURITY DEFINER functions (`add_credits`, `deduct_credits`, `handle_new_user_credits`, `increment_usage_counter`, `rls_auto_enable`) were callable by `anon`/`authenticated` via public REST RPC → anyone could mint/drain credits. Revoked EXECUTE from PUBLIC, granted to `service_role` only; pinned search_path. Verified anon/authd=false, service=true. (First revoke-from-anon attempt was a no-op — PUBLIC grant; corrected by revoking from PUBLIC.)
- [ ] RLS on all user-owned tables (run `get_advisors security` — remaining: tighten always-true INSERT policies on `affiliate_clicks`/`category_notify` (spam, post-launch); enable leaked-password protection in Auth settings)
- [ ] Stripe live keys + prod webhook
- [ ] Resend domain verification
- [ ] Vercel prod env vars complete — including NEW: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limiting no-op until set) and `NEXT_PUBLIC_SENTRY_DSN` (error monitoring no-op until set)
- [ ] Post-deploy: trigger a test error and confirm it appears in the Sentry dashboard
- [ ] Confirm Supabase project is ACTIVE (not paused) at launch. Free tier auto-pauses after 7 consecutive days of ZERO DB activity — real user traffic keeps it awake, so this only risks the quiet pre-launch window. Don't let the project sit completely untouched for a week before launch. (Optional: a keep-alive ping every few days, or upgrade to Pro $25/mo for never-pause + daily backups.)
