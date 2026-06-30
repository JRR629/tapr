# Tapr Launch Audit — Security (Pass 2) + Privacy/Legal (Pass 3)

← back to [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md)

## Security — what's already right (do not rework)

- **Auth:** `middleware.ts` uses `supabase.auth.getUser()` (validates the JWT, not just a cookie). Protected route prefixes redirect unauthenticated users; auth pages redirect authenticated users.
- **Admin:** server-side check in `app/api/admin/products/route.ts:82-97` (`user.id !== ADMIN_USER_ID` → 403) on every method; nav link is a server component gated the same way.
- **Affiliate URL secrecy (excellent):** `affiliate_url` is fetched and resolved only server-side in `app/api/affiliate/click/route.ts`; `adminGetAllProducts` is stripped via `sanitizeProduct` (`admin/products/route.ts:75-80`). Never in client state/DOM.
- **Stripe webhook:** signature verified (`stripe/webhook/route.ts:23`), admin client used only post-verification, credit grant carries `p_stripe_session_id` for idempotency, non-payment events short-circuit.
- **No IDOR:** `recommendations/[id]` / `comparisons/[id]` scope to `user_id`.
- **No secrets in client:** no `NEXT_PUBLIC_` prefix on any secret; `.env.local` is gitignored and untracked. No hardcoded keys found.
- **No `dangerouslySetInnerHTML`** in the app (React auto-escaping intact → output-XSS surface minimal).

## SEC-1 — No rate limiting / bot protection on public endpoints (HIGH)
- **Files:** `app/api/contact/route.ts`, `app/api/category-notify/route.ts`, `app/api/notify/route.ts` (waitlist), `app/api/auth/reset-password/route.ts` — none have rate limiting, captcha, or honeypot.
- **Attack surface:**
  - **Email bombing:** `reset-password` and `contact` send email to a user-supplied address with no throttle → an attacker can spam any victim's inbox and burn your Resend quota/reputation.
  - **Contact = spam amplifier:** `contact/route.ts:38-57` sends a confirmation email to the *unverified* submitted address; combined with no rate limit, Tapr becomes an open relay for nuisance email.
  - **Waitlist/notify pollution:** unlimited inserts into `category_notify` / waitlist tables.
  - **Email enumeration:** `category-notify` returns `ALREADY_SIGNED_UP` vs `success` (minor). `reset-password` correctly does *not* leak existence (`:42-44`) — good.
- **Fix:** Add IP-based rate limiting (Upstash `@upstash/ratelimit` or a Vercel KV token bucket) to all four; add a honeypot field + min-time-to-submit on the public forms; consider Cloudflare Turnstile on `contact`. Verify the victim's address before sending the contact confirmation, or drop the confirmation email entirely.
- **Effort:** S–M · **Blocks launch:** Recommended (cheap insurance against day-one abuse + Resend cost).

## SEC-2 — HTML injection in transactional emails (LOW)
- **File:** `app/api/contact/route.ts:42-57` — `${name}` and `${message.replace(/\n/g,'<br>')}` are interpolated unescaped into the confirmation email's `html`. The owner notification correctly uses `text:` (safe).
- **Impact:** Low — email clients sanitize aggressively and blast radius is the recipient's own inbox — but it's untrusted input in an HTML string.
- **Fix:** HTML-escape `name`/`message` before interpolation (or render via `text:`).

## SEC-3 — Prompt injection (MEDIUM-LOW)
See [ENG-3](./LAUNCH_AUDIT_ENGINEERING.md). User free-text (profile + Layer-2 + `externalProducts`) is interpolated raw into Claude prompts. Limited blast radius (own recommendation only; product IDs validated; output auto-escaped). Harden with delimiters + length caps.

## SEC-4 — No application security headers (MEDIUM)
- **File:** `next.config.mjs` is empty `{}` — no `headers()`.
- **Missing:** `Content-Security-Policy` (or at least `frame-ancestors`), `X-Frame-Options: DENY` (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`. Vercel terminates HTTPS but does not set these for you.
- **Fix:** Add a `headers()` block in `next.config.mjs`. (`compare/route.ts:281` already sets `nosniff` on its stream — generalize.)
- **Effort:** S · **Blocks launch:** No, but do in launch week.

## SEC-5 — `?debug=1` disk/log surface (MEDIUM)
See [ENG-5](./LAUNCH_AUDIT_ENGINEERING.md). Gate behind admin/env.

## Security launch-blocker list
None are hard auth/data-exposure blockers — the core auth, authorization, secret-handling, and affiliate-URL model are sound. **SEC-1 (rate limiting) is the one I'd fix before launch** to avoid day-one email abuse and Resend cost.

---

# Privacy / Legal (Pass 3) — not legal advice; flag-for-attorney where noted

## Already in place (good)
- **Privacy Policy** (`app/(marketing)/privacy/page.tsx`) is genuinely thorough: enumerates collected data incl. height/weight/body measurements (`:54-55`), explicitly classifies body measurements as *fitness-related, not medical* (`:62`), discloses sub-processors (Supabase, Anthropic — `:125-137`), states Anthropic won't train on inputs, 30-day deletion on account closure (`:190`), data-subject rights (`:201`), under-13 children clause (`:213-217`), affiliate-click logging (`:81, 105, 171-178`).
- **Terms** (`app/(marketing)/terms/page.tsx`) covers affiliate relationships (`:114-126`) and includes a "consult a qualified medical or fitness professional" line (`:60`).
- **Affiliate disclosure present in all three required locations** (corrects an earlier finding): footer (`launch/page.tsx:401`, `page.tsx:163`), recommendation result page (`recommendation/page.tsx:310`), **and onboarding final step (`OnboardingWizard.tsx:984`)**. FTC-aligned.

## LEG-1 — Health/nutrition disclaimer only lives in Terms (MEDIUM)
- Nutrition is a live category giving caffeine / GI-tolerance / allergen guidance (`lib/anthropic.ts:250-259` reads `caffeine_strategy`, `gi_distress`, `dietary_restrictions` incl. vegan/gluten); `dietary_restrictions` is collected in the questionnaire.
- **Risk:** Allergen/caffeine recommendations with the only disclaimer buried in Terms. A user with a stated allergy who is recommended a product is a real consumer-safety/liability edge.
- **Fix:** Add a visible, result-adjacent disclaimer on nutrition recommendations: *"Not medical or dietary advice. Always verify ingredients and allergens with the manufacturer before use."* Mirror the existing one-line disclosure band pattern (`recommendation/page.tsx:307`).
- **Flag for attorney:** whether allergen-aware recommendations warrant explicit affirmative consent / stronger waiver.

## LEG-2 — Marketing claims need a substantiation surface (MEDIUM)
- `launch/page.tsx` (WhyTapr, `:266`) claims recommendations are "grounded in structured data from the reviews that serious athletes actually trust, with scores that reflect what reviewers found," and jabs competitors by name (ChatGPT/Gemini). The claims are defensible *if* substantiated — but there is **no methodology/sources/About page** (see [DESIGN_UX](./LAUNCH_AUDIT_DESIGN_UX.md), trust gap). The conversion claim in the business plan ("3–5% vs 0.5–1%") must not appear in public copy without basis (it currently doesn't — keep it that way).
- **Fix:** Publish a methodology/"how we source reviews" page and link the data claims to it. Reduces both legal exposure and the conversion-trust gap in one move.

## LEG-3 — Geographic / privacy-law posture (FLAG FOR ATTORNEY)
- Collecting fitness data + email + payment from likely-global endurance athletes. The policy covers rights and deletion but does not name **GDPR/UK GDPR** or **US state laws (CCPA/CPRA etc.)** or provide a cookie/consent mechanism. Analytics (Vercel) is cookieless-ish, reducing cookie-consent pressure, but EU traffic + fitness data is worth an attorney pass.
- COPPA: under-13 clause exists; confirm signup has no under-13 path.

## Payments / ecommerce (good)
- Pricing is clear and one-time (no subscription → lower auto-renew disclosure burden). `stripe/checkout/route.ts` validates the pack enum, uses server-side price IDs, attaches `supabase_user_id`. Refund policy for credit packs is **not** stated anywhere — add a short "credits are non-refundable / do not expire" line to Terms or billing (FLAG: digital-goods refund expectations vary by jurisdiction).
