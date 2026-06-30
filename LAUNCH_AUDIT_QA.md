# Tapr Launch Audit — QA Test Plan (Pass 9)

← back to [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md)

No automated tests exist in the repo today (no test runner in `package.json`). Below is a manual launch plan plus the highest-value automated tests to add.

## Smoke tests (must all pass before launch)
- [ ] `/` loads; primary CTA reaches a real signup path (post homepage-swap — see [DESIGN_UX UX-3/waitlist](./LAUNCH_AUDIT_DESIGN_UX.md))
- [ ] Signup → email confirm → onboarding → dashboard
- [ ] One recommendation in **each** active category: wetsuits, gps-watches, running-shoes, nutrition (confirms all three engine patterns)
- [ ] Credit decrements by exactly 1 on a recommendation; balance visible (after UX-1 fix)
- [ ] 2-product compare = 1 credit; 3–4 product compare = 2 credits; **5th product rejected server-side** (`compare/route.ts:50`)
- [ ] Affiliate click opens a new tab to a real product page; raw `affiliate_url` never appears in DOM/network response body
- [ ] Stripe credit-pack purchase (test mode) grants credits via webhook; balance updates
- [ ] Logout; `/404`; mobile nav at 375px
- [ ] Coming-soon category → email capture (not a blank page)

## Edge cases (script these — several map to open bugs)
- [ ] **0-credit user completes questionnaire** → must NOT dead-end (currently does — [UX-2](./LAUNCH_AUDIT_DESIGN_UX.md))
- [ ] **Claude returns malformed JSON** → confirm credit is refunded (currently is NOT — [ENG-1](./LAUNCH_AUDIT_ENGINEERING.md))
- [ ] Empty product set in a category within budget → no credit lost ([ENG-1](./LAUNCH_AUDIT_ENGINEERING.md))
- [ ] Double-click "Get recommendation" → no double-deduct
- [ ] Refresh mid-stream; back button mid-flow; session expiry mid-flow
- [ ] Webhook replay / duplicate `checkout.session.completed` → credits granted once only (verify `add_credits` dedupes on `p_stripe_session_id` — [manual check](./LAUNCH_AUDIT.md#manual))
- [ ] Long / special-char / emoji input in profile free-text fields (also exercises [ENG-2](./LAUNCH_AUDIT_ENGINEERING.md) validation gap + [ENG-3](./LAUNCH_AUDIT_ENGINEERING.md) injection)
- [ ] Reset password for a non-existent email → success response, no account-existence leak

## Role-based tests
- [ ] Anonymous → protected routes redirect to `/login`
- [ ] Free-credits user; zero-credits user
- [ ] **Admin vs non-admin:** call `/api/admin/products` directly (not via UI) as a non-admin → expect 403 (`admin/products/route.ts:92`); confirm admin nav link hidden for non-admins

## Browser / device matrix
Chrome desktop · Safari desktop · Firefox desktop · iPhone Safari · Android Chrome. Spot-check 375px (iPhone SE) for the questionnaire, recommendation cards, and modals.

## Accessibility manual tests (see [DESIGN_UX Pass 5](./LAUNCH_AUDIT_DESIGN_UX.md))
- [ ] Keyboard-only: complete signup, onboarding, one recommendation, one compare — no keyboard traps, visible focus throughout
- [ ] Screen reader (VoiceOver) on auth forms (labels — A11Y-1), error states (role=alert — A11Y-2), and the questionnaire selects (A11Y-5)
- [ ] `prefers-reduced-motion` enabled → animations suppressed (after A11Y-7 fix)

## Recommended automated tests (none exist; add in priority order)
| Test | Flow / file | Why | Tool |
|---|---|---|---|
| E2E happy path | signup → onboarding → recommendation → credit decrement | core revenue path, zero coverage today | Playwright |
| API: `/api/recommend` | 401 / 402 / 422 / **refund-on-failure** | guards [ENG-1](./LAUNCH_AUDIT_ENGINEERING.md) regression | Vitest + route handler |
| API: `/api/affiliate/click` | asserts response body never contains `affiliate_url` | protects the #1 security invariant | Vitest |
| Webhook idempotency | duplicate `checkout.session.completed` grants once | paid-but-no-credits / double-grant | Vitest |
| API: `/api/compare` | 4-product cap + credit-cost matrix | core business rule | Vitest |
| Accessibility | axe on `/`, auth, questionnaire, recommendation | catches label/role regressions | jest-axe / Playwright-axe |

Add a `test` script + a CI gate (GitHub Actions running `next build` + the above) so the broken-build class of issue ([ENG build](./LAUNCH_AUDIT_ENGINEERING.md)) can never reach `main` again.
