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

- [ ] `vercel.com` → project **`tapr-tio3`** → **Settings** → **Environment Variables**
- [ ] Confirm these include **"Production"** in their environment label:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_SENTRY_DSN`

> NOTE: Vercel hides secret values (you'll see dots) — that's why the real $2.99 purchase (already
> passed) was the true test of the live Stripe key.
> GOTCHA: if you change any variable here, the live site does NOT update until a redeploy — tell Claude.

**Task 2 result: _______________________________________________**

---

## TASK 3 — Resend: so your emails don't bounce

> Your site sends email as `hello@taprai.com`. That only works if the domain is verified.

- [ ] `resend.com` → **Domains**
- [ ] Find **`taprai.com`** and check its status:
  - [ ] **"Verified"** (green) → done ✅
  - [ ] **"Pending" / red** → click into it, it shows DNS records to add → tell Claude what it shows
  - [ ] Not in the list at all → tell Claude

**Task 3 result: _______________________________________________**

---

## TASK 4 — Supabase: turn on one security setting

> Blocks signups using passwords known to be leaked in past hacks. One toggle.

- [ ] `supabase.com/dashboard` → your Tapr project → **Authentication**
- [ ] Find **"Leaked password protection"**
      (may live under "Attack Protection," "Policies," or "Password security")
- [ ] Switch it **ON**, save if needed
- [ ] Can't find it → tell Claude (he can locate it from the security advisories)

**Task 4 result: _______________________________________________**

---

## CODE FOLLOW-UPS (Claude handles — not your dashboards)

Both are coded and build-verified, but NOT yet deployed. Claude will push them together.

- [x] Orange border removed from the "Most Popular" credit pack (badge is enough) — coded
- [x] Misleading "credits added" message fixed — the billing page now verifies the real
      purchase (polls for the webhook's credit_transactions row) and only says "added" once
      credits truly land; shows "confirming…" first, and an honest "processing" note if the
      webhook is slow. Balance refreshes live on confirm. — coded
- [ ] DEPLOY the two items above (Claude: commit → merge to main → push)

---

## When you're done

Tell Claude the result of Tasks 2–4 in plain words. Stripe (Task 1) is already done.
