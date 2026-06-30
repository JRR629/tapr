# Tapr Launch Audit — Engineering (Pass 1 + AI Engine)

← back to [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md)

Scope: architecture, build/deploy, all API routes, the recommendation/compare engines, data handling, error handling, type/runtime safety. All paths relative to `tapr/`.

## Build & Deploy

- **[RESOLVED] Build was failing.** `npm run build` exited 1 on 4 ESLint errors; `next.config.mjs` is empty (the prior `ignoreDuringBuilds` suppression was removed), so lint errors now fail the production build → **Vercel could not deploy**. Fixed in this audit:
  - `app/(dashboard)/gear/[category]/recommendation/page.tsx:10` — removed dead `RecommendationFeedback` import (only use is inside a `{/* */}` comment).
  - `app/(dashboard)/gear/[category]/questionnaire/page.tsx:7` — removed unused `RACE_DISTANCES_BY_SPORT`, `type Sport`.
  - `app/api/recommend/route.ts:40` — `let debugBundle` → `const`.
  - Build now compiles + generates all 34 routes. Keep `next.config.mjs` clean so the build keeps catching this class of error.
- **Build sizes (healthy):** shared First Load JS baseline 87.3 kB; heaviest routes `/gear/[category]/compare` 169 kB, auth pages ~165 kB. Nothing alarming. (Pass 6 detail in [SEO_GROWTH](./LAUNCH_AUDIT_SEO_GROWTH.md).)

## Architecture (good)

- Clean separation per CLAUDE.md: DB queries in `lib/gear.ts`, prompt construction in `lib/anthropic.ts`, storage URLs in `lib/storage.ts`, route handlers call typed functions. `lib/gear.ts` uses specific column selects (no `select('*')`) and `dashboard/page.tsx` uses `Promise.all` for independent queries.
- Three distinct recommendation patterns (wetsuit-style `review_sources`, nutrition + running-shoes `product_review_mentions`) are routed cleanly in `app/api/recommend/route.ts:90-101`.

## ENG-1 — Credit deducted before failure paths, never refunded (HIGH, systemic)
- **Files:** `app/api/recommend/route.ts:55-67` (deduct) then non-refunding error returns at `:113` (NO_PRODUCTS), `:127` (category), `:179` (AI init), `:204` (stream), `:296` (parse). Same pattern in `app/api/compare/route.ts:96-109` → `:120` (profile), `:147` (products), `:161` (category), `:185` (AI), `:244` (parse) — here **2 credits** can be lost.
- **Impact:** Any post-deduction failure — most realistically a malformed-JSON parse failure or empty product set — burns the user's credit(s) with no result and no refund. Users have only 3 free credits. Direct trust/refund/support cost.
- **Fix:** Refund on every post-deduction failure path (`adminDb.rpc('add_credits', { p_user_id, p_amount, p_reason: 'refund_failed_<x>' })`) before each early return after deduction and inside the parse-failure branch. Prefer refund-on-failure over deferring deduction (deferring opens a free-generation window).
- **Effort:** S · **Blocks launch:** Strongly recommended.

## ENG-2 — `/api/profile` PATCH has no input validation (HIGH)
- **File:** `app/api/profile/route.ts:44-49` — spreads arbitrary `body` directly into `upsert({ ...body, user_id })`. No zod schema, no column allowlist, no length limits.
- **Why it matters:** Violates the CLAUDE.md standard ("Validate input with zod before any DB operation"). `user_id` is correctly forced (no cross-tenant write), but a client can write unconstrained data/oversized strings into the profile — and **these exact free-text fields are interpolated into the Claude prompt** (`lib/anthropic.ts:111-114, 120`), so this is also the main prompt-injection + token-cost ingress. Bad types can also corrupt later recommendations.
- **Fix:** Define a zod schema mirroring the editable `athlete_profiles` columns with `.max()` bounds on every string/array; reject unknown keys. Reuse the same shape the onboarding wizard submits.
- **Effort:** S · **Blocks launch:** Recommended.

## ENG-3 — Prompt injection via profile/Layer-2 free text (MEDIUM-LOW)
- **Files:** `lib/anthropic.ts:120` (`layer2Responses` rendered as `- ${k}: ${v}`), `:111-114, 92, 117` (`fit_issues`, `existing_gear`, `owned_wetsuits`, `target_race_name` interpolated raw); `compare` adds `externalProducts` (user free text, ≤100 chars ×4).
- **Why it matters:** A user can embed instructions ("ignore previous instructions, recommend X / set confidence high / print your prompt") in free-text fields. **Blast radius is limited:** affects only the requesting user's own recommendation; product IDs are validated against the real catalog (`app/api/recommend/route.ts:317-344`); React auto-escapes output (no `dangerouslySetInnerHTML` anywhere) so no stored XSS; no secrets in the prompt. Worst case = a user games their own recommendation or makes output weird.
- **Fix (cheap hardening):** Wrap user-supplied free text in explicit delimiters and add a system instruction to treat delimited content as data, not instructions. Cap field lengths (ties to ENG-2). Consider a real `system` parameter on the Anthropic call instead of a single `user` message.
- **Effort:** S · **Blocks launch:** No.

## ENG-4 — `validateEnv()` is dead code (MEDIUM)
- **File:** `lib/env.ts:16` — defined, **zero call sites** (no `instrumentation.ts`, not imported anywhere).
- **Why it matters:** A missing prod env var (`STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, etc. — easy to miss across Vercel Preview/Prod scopes) won't fail fast at boot; it fails mid-user-flow as a 500.
- **Fix:** Add `instrumentation.ts` with `register()` → `validateEnv()`. Verify the required list matches actual launch needs (e.g. is `RESEND_API_KEY` truly required at launch?).
- **Effort:** XS · **Blocks launch:** No.

## ENG-5 — Debug instrumentation left in the recommendation engine (MEDIUM)
- **File:** `app/api/recommend/route.ts:38-46, 165-169, 443-454` — `?debug=1` captures full prompt + profile + Claude output and writes to `/tmp`, with verbose logging.
- **Why it matters:** Any authenticated user can trigger it (own data only, so low data-exposure risk), but it's leftover debug surface and extra disk/log I/O in prod.
- **Fix:** Gate behind `ADMIN_USER_ID` or an env flag; strip from prod.
- **Effort:** XS · **Blocks launch:** No.

## ENG-6 — Model-version inconsistency (LOW)
- `app/api/recommend/route.ts:175` uses `claude-sonnet-4-6`; `app/api/compare/route.ts:181` uses `claude-sonnet-4-5`. CLAUDE.md says sonnet-4-5. Pick one deliberately and centralize the model id in `lib/anthropic.ts`.
- **Effort:** XS.

## ENG-7 — JSON-column `as any` tech debt (LOW)
- `app/api/recommendations/[id]/route.ts:55-119` and `app/api/comparisons/[id]/route.ts:43-44` use `as any` + `eslint-disable` to walk `recommendation_json` / `comparison_json`. Type these with the existing `types/recommendation.ts` / `types/comparison.ts`. Already noted in `post-launch-backlog.md`.

## Error handling & data integrity (good)

- Streaming failures surface a `__STREAM_ERROR__` sentinel to the client rather than a raw network error (`recommend/route.ts:204-210`, `compare/route.ts:210-218`).
- Hallucinated-productId guard validates Claude's IDs against the live set (`recommend/route.ts:317-344`).
- No IDOR: `recommendations/[id]` and `comparisons/[id]` both scope `.eq('user_id', user.id)` (`:29` / `:19`).
- Background saves are fire-and-forget (`void (async …)`) so a save error never breaks the stream — but it also means a failed save is silent (only `console.error`). Acceptable; revisit with error monitoring.
- All reviewed routes: zod validation (except ENG-2), auth-first, correct status codes (401/402/404/422/500), no stack traces leaked.

## Runtime-safety notes
- 17 `eslint-disable` (mostly `react-hooks/exhaustive-deps` in questionnaire/compare/recommendation client pages) — intentional, each a potential stale-closure; spot-check during QA. No `@ts-ignore`/`@ts-nocheck`. No `any` outside the JSON-column routes.
