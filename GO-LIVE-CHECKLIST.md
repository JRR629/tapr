# Tapr — Go-Live Checklist

**How to use this file:** Keep it open in a tab. Work top to bottom. Check the boxes as you go.
Ask Claude anything in the chat — this file stays put, so you won't lose your place.

Legend: `[ ]` = to do · `[x]` = done

---

## ✅ ALREADY DONE (verified — nothing for you to do)

- [x] New code merged to `main` and deployed to production
- [x] Production build succeeded (no errors)
- [x] Domain connected — `taprai.com` and `www.taprai.com` both point at the live build
- [x] Site loads — new homepage confirmed live
- [x] Sentry error monitoring confirmed working (test error was received)

---

## ✅ TASK 1 — Stripe (money pipeline): RESOLVED

**Status: WORKING end to end.** A real $2.99 purchase went through and credits landed
(balance moved 9998 → 10001). Payment → webhook → credit grant all confirmed.

Two bugs were found and fixed along the way:
- [x] **Buy buttons failed** ("No such price: 'prod_...'") — Vercel had Stripe **Product IDs** (`prod_`)
      where **Price IDs** (`price_`) belong. Fixed by putting the correct `price_...` IDs into the
      `STRIPE_CREDITS_*_PRICE_ID` variables in Vercel + redeploy.
- [x] **Paid but no credits** — the Stripe webhook pointed at the bare domain `taprai.com`, which
      redirects to `www`. Stripe doesn't follow redirects, so the event never arrived. Fixed by
      changing the webhook URL to `https://www.taprai.com/api/stripe/webhook`.

---

## TASK 2 — Vercel: confirm keys are on the live site

> Your site reads its secret keys from Vercel. They must be marked for the **Production** environment.

- [X] `vercel.com` → project **`tapr-tio3`** → **Settings** → **Environment Variables**
- [X] Confirm these include **"Production"** in their environment label:
  - [X- SAYS PRODUCTION AND PREVIEW] `STRIPE_SECRET_KEY`
  - [X- SAYS PRODUCTION AND PREVIEW] `NEXT_PUBLIC_SENTRY_DSN`

> NOTE: Vercel hides secret values (you'll see dots) — that's why the real $2.99 purchase (already
> passed) was the true test of the live Stripe key.
> GOTCHA: if you change any variable here, the live site does NOT update until a redeploy — tell Claude.

**Task 2 result: _______________________________________________**

---

## TASK 3 — Resend: so your emails don't bounce

> Your site sends email as `hello@taprai.com`. That only works if the domain is verified.

- [x] `resend.com` → **Domains**
- [x] Find **`taprai.com`** and check its status:
  - [x] **"Verified"** (green) → done ✅
  - [ ] **"Pending" / red** → click into it, it shows DNS records to add → tell Claude what it shows
  - [ ] Not in the list at all → tell Claude

**Task 3 result: _______________________________________________**

---

## ✅ TASK 4 — Supabase password security: RESOLVED

**Decision:** stay on the free plan (no Pro upgrade). Free hardening applied:
- [x] Minimum password length 6 → 8
- [x] Password requirements: required mix (lower + upper + digits)
- [x] Secure password change: ON
- [x] Require current password when updating: ON

Consciously **skipped**: leaked-password protection (HaveIBeenPwned) — Pro-plan only,
not worth an upgrade now. Revisit if you ever move Supabase to Pro.

---

## ✅ CODE FOLLOW-UPS — DEPLOYED (live in production, commit 1f3b3be)

- [x] Orange border removed from the "Most Popular" credit pack (badge is enough)
- [x] "Credits added" message now verifies the REAL purchase before claiming success — polls
      /api/stripe/verify for the webhook's credit_transactions row; shows "confirming…" first, an
      honest "processing" note if the webhook is slow, and refreshes the balance live on confirm
- [x] Admin link is live (ADMIN_USER_ID set in Vercel) — amber dashboard icon in the header
- [x] Social share card (OG image) live — generated 1200×630 branded card (commit 1266e7f)
- [x] Apex domain fixed — `taprai.com` now resolves and redirects to `www.taprai.com`

---

## 🚀 LAUNCH READY

Every go-live item is complete. Working and verified: live site, custom domain
(`taprai.com` → `www`), payments (buy → webhook → credits, proven with a real purchase),
honest purchase confirmation, admin access, Sentry error monitoring, Resend email, and the
social share card. Only consciously-skipped item: Supabase leaked-password protection (Pro-only).

### Known post-launch follow-ups (none blocking)
- Swap Preview env to a TEST Stripe key (so preview URLs can't charge real cards)
- Wetsuit affiliate links — reapply for affiliate status after some sales/traffic (~3 months or ~500 users)
