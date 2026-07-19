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

## ⚠️ TASK 4 — Supabase password security (NOT done — needs a decision)

> Supabase's own security check confirms **"Leaked Password Protection Disabled"** — so despite the
> toggle, it is NOT on. That specific feature (the HaveIBeenPwned check) is **Pro-plan only**, so it
> can't be enabled on the free plan.

DECIDE:
- [ ] **Option A** — upgrade Supabase to Pro ($25/mo), then the leaked-password toggle works. Overkill just for this right now.
- [ ] **Option B (recommended)** — stay free, skip leaked-password, do the FREE hardening instead:
  - [ ] Minimum password length: change **6 → 8**
  - [ ] Password requirements: pick a required mix (lower + upper + digits)
  - [ ] Secure password change: **ON**
  - [ ] Require current password when updating: **ON**
  - [ ] Save

**Task 4 result: _______________________________________________**

---

## ✅ CODE FOLLOW-UPS — DEPLOYED (live in production, commit 1f3b3be)

- [x] Orange border removed from the "Most Popular" credit pack (badge is enough)
- [x] "Credits added" message now verifies the REAL purchase before claiming success — polls
      /api/stripe/verify for the webhook's credit_transactions row; shows "confirming…" first, an
      honest "processing" note if the webhook is slow, and refreshes the balance live on confirm
- [x] Admin link is live (ADMIN_USER_ID set in Vercel) — amber dashboard icon in the header

---

## When you're done

Tell Claude the result of Tasks 2–4 in plain words. Stripe (Task 1) is already done.
