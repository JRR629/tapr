# Tapr Launch Audit — Design/UX (Pass 4), Accessibility (Pass 5), Product (Pass 10)

← back to [LAUNCH_AUDIT.md](./LAUNCH_AUDIT.md)

---

## Pass 4 + 10 — UX / Conversion / Product

### UX-1 — Credit balance is never shown anywhere (HIGH, rule violation)
- `components/CreditBalance.tsx` exists but is **imported nowhere** (dead code). The persistent header (`components/CompactHeader.tsx`) shows only logo + Settings. Users see their balance only by visiting `/billing`.
- Violates CLAUDE.md ("Always show credits remaining so users are aware of balance"). Credits are the paid mechanism — hiding the balance kills purchase awareness and makes the 0-credit wall feel like a bait-and-switch.
- **Fix:** Render `CreditBalance` in `CompactHeader` + dashboard hero (links to `/billing`). **Effort:** S · **Blocks launch:** Yes.

### UX-2 — 0-credit users hit a dead-end AFTER the full questionnaire (CRITICAL)
- `components/CreditGate.tsx` exists but is **used nowhere**. `questionnaire/page.tsx` (`handleNext`, ~`:1533`) pushes to the recommendation route with no credit check. The credit is only checked when `/api/recommend` deducts and returns 402, which surfaces as a generic red error box (`recommendation/page.tsx:210-231`) with "Try Again"/"Back" — **no buy-credits CTA.**
- A returning 0-credit user answers 10–15 questions, watches the loading animation, then dead-ends. Directly violates CLAUDE.md ("never a dead end… show pack options inline"). This is the single worst drop-off in the funnel.
- **Fix:** Gate at questionnaire entry (the "Get My Recommendation" CTA on `gear/[category]/page.tsx`) with the existing `CreditGate`, AND render an inline buy-pack block in the recommendation page's 402 branch. **Effort:** M · **Blocks launch:** Yes.

### UX-3 — Running Shoes shown as "Coming Soon" on the landing, contradicting DB/CLAUDE.md (HIGH)
- `launch/page.tsx:57` badge ("Wetsuits · GPS Watches · Nutrition · Now live"), `LaunchCategories` (`:195-208`) puts **Running Shoes under Coming Soon**, and `:216` says "Three categories. Fully launched." But CLAUDE.md lists 4 active categories incl. Running Shoes, the questionnaire ships `RUNNING_SHOES_STEPS`, and `lib/gear.ts` serves whatever is `is_active=true`.
- Either a live category is advertised as unavailable (conversion leak) or CLAUDE.md/DB are wrong. **Resolve source-of-truth before launch.** **Effort:** XS (copy) once confirmed · **Blocks launch:** Yes (accuracy).

### UX-4 — Onboarding is 15–16 required steps; contradicts the "3–4 minute" promise (HIGH)
- `OnboardingWizard.tsx` `stepKeys` (~`:773`): sports, focus, race_distances, experience, background, gender, DOB, country/city, height, weight, budget, fit_issues, existing_gear, racing_profile, target_race (+ optional measurements). All required (`canAdvance` `:103-128`), one question per screen. Landing promises "4-minute setup" (`:82`) / "a specific answer in 3 minutes" (`:177`).
- Steepest cliff in the funnel, stacked *before* a ~10–15 step questionnaire. Several fields (gender, DOB, racing season, target race) don't all materially change a first recommendation.
- **Fix:** Split into essentials (6–7) + "refine later," or mark non-critical steps optional; reconcile the time claim. **Effort:** M · **Blocks launch:** No (high priority).

### UX-5 — No persistent nav to Billing / Profile / history (MEDIUM)
- `layout.tsx` + `CompactHeader` expose only logo + Settings; `HeaderController` hides the header entirely on `/dashboard`. Users who *want* to buy credits have no proactive path to `/billing`. **Fix:** add Credits (→/billing) + Profile to the header. **Effort:** S.

### UX-6 — Pricing section is a non-functional table (MEDIUM)
- `launch/page.tsx:283-371`: all four tiers (Free/3/10/25) have identical CTA "Get started free"→`/signup` and identical feature bullets. Paid packs can't be bought here and repeated bullets read as filler. **Fix:** make Free the hero; show packs as a compact "when you need more" strip with per-rec math. **Effort:** S.

### UX-7 — Polished skeleton exists but a spinner is used instead (LOW)
- `recommendation/page.tsx:17` defines `_RecommendationSkeleton` (layout-matching, per CLAUDE.md standard) but the loading branch (`:234-266`) renders `LoadingProgress` (centered spinner). CLAUDE.md requires skeletons that mirror final layout. **Fix:** swap in the skeleton. **Effort:** XS.

### Copy issues
- Inconsistent time claims: "4-minute setup" (`:82`) vs "3 minutes" (`:177`) vs 15-step reality. Pick one honest number.
- "Three categories. Fully launched." (`:216`) — wrong count if running-shoes is live (UX-3).
- Pack sub-copy "For the gear-curious athlete" (`:318`) is vague; tie each pack to a concrete outcome.
- `billing/page.tsx:72` "Purchase credit packs to get gear recommendations" understates the 3 free credits — soften.
- `getFirstName` from email (`dashboard/page.tsx:34`) can produce odd greetings; low severity.

### Missing trust elements (HIGH — the conversion ceiling)
For an AI affiliate recommender, trust *is* the sale, and the pre-conversion surface is thin:
- **No testimonials / social proof / user counts** on `launch/page.tsx`. The only proof is a single hardcoded `MockRecommendation` (`:88-150`).
- **No About / methodology / "how we source reviews" page** (none found). CLAUDE.md references `trust-model.md` that was never turned into a page. This leaves the #1 objection ("why trust an AI over Wirecutter?") unanswered and the data-integrity claims unsubstantiated (see [LEG-2](./LAUNCH_AUDIT_SECURITY_LEGAL.md)).
- **No "who's behind this"** — affiliate independence cues matter; footer is just "© 2026 Taprai, LLC."
- **Post-conversion trust is strong** (don't rework): per-recommendation sources are cited (`RecommendationCard.tsx:298-329`) with a confidence explainer. The gap is entirely pre-signup.

### Product risks
- `CreditGate` + `CreditBalance` are both spec'd-then-dropped dead code — the paid mechanic effectively launches invisible and dead-ends paying users. Highest-leverage fix is simply wiring them in (UX-1, UX-2).
- Empty states are otherwise good (category no-rec `gear/[category]/page.tsx:98`, coming-soon `questionnaire/page.tsx:1442`); the 402 path is the lone "dead end."
- Combined onboarding + questionnaire length is high for a speed pitch — show value sooner.

---

## Pass 5 — Accessibility (against practical WCAG 2.1 AA)

### Already done well (do not rework)
- `globals.css:86` global `:focus-visible { outline: 2px solid #FF6B35 }` — app-wide keyboard focus on native elements.
- Touch targets: `min-h-[44px]` consistent across nav/buttons/inputs; onboarding options 52–56px.
- Contrast tokens deliberate: `--color-gray-400 #9CA3AF` (7.3:1 on navy) for body text; `#6B7280` reserved for decorative.
- The three content modals have `role="dialog"`, `aria-modal`, Escape, and (CategoryActionModal) scroll-lock; two use `aria-labelledby`.
- Icon-only nav buttons are `aria-label`led. Contact form labels are correctly associated.

### A11Y-1 — Auth form labels not associated with inputs (HIGH)
- `login/page.tsx:61,75`, `signup/page.tsx:125,138,151`, `reset/page.tsx:79` — bare `<label>` with no `htmlFor`, inputs with no `id`. First three screens for every new user; WCAG 1.3.1/4.1.2 failure; hurts password-manager autofill. **Fix:** wire `id`/`htmlFor` (copy the contact page). **Effort:** XS · **Blocks:** Yes (trivial, high visibility).

### A11Y-2 — Auth/error messages not announced (HIGH)
- Error containers (`login:53`, `signup:117`, `reset:71`, `EmailCapture:81`, `contact:118`, both feedback modals) lack `role="alert"`/`aria-live`. A screen-reader user gets no feedback on login failure. **Fix:** add `role="alert"`. **Effort:** S · **Blocks:** Yes for auth.

### A11Y-3 — Modals/drawers don't trap or move focus (HIGH)
- `CategoryActionModal:42`, `ReportCorrectionModal:97`, `SuggestProductModal:81`, and the mobile nav drawers (`TopNav.tsx:135`, `NavSidebar.tsx:146`) never move focus in on open, don't trap Tab, don't restore focus on close. Drawers also lack `role="dialog"`/`aria-modal`/Escape entirely. `aria-modal="true"` is a promise the code doesn't keep (WCAG 2.4.3). **Fix:** adopt Radix `Dialog` (shadcn in stack) or a `useFocusTrap`; at minimum add Escape + initial focus to drawers and modals. **Effort:** M · **Blocks:** Borderline — do the minimum before launch.

### A11Y-4 — Custom Compare dropdown lacks listbox semantics + Escape (MEDIUM)
- `ProductPickerDropdown.tsx:109-255` — no `role="combobox/listbox/option"`, no `aria-expanded`, no arrow-key nav, no Escape (only outside-click). Gates the paid Compare flow. Operable via Tab today but degraded. **Fix:** add combobox semantics + Escape + roving focus. **Effort:** M.

### A11Y-5 — Questionnaire/onboarding selects have no radio/checkbox semantics (MEDIUM)
- `questionnaire/page.tsx:42-122` single/multi-selects are styled `<button>`s with no `role="radio"`/`role="checkbox"` + `aria-checked`, and no group association to the question label. Selection state is visual-only (orange border + scale) — borderline WCAG 1.4.1 for single-selects (`:52-56`, no check icon). This is the entire recommendation-input flow. **Fix:** add `role`+`aria-checked` + `aria-labelledby` group (or `fieldset`/`legend`). **Effort:** M.

### A11Y-6 — Onboarding measurement/date inputs unlabeled (MEDIUM)
- `OnboardingWizard.tsx` `MeasurementInput` (`:175-179`) label has no `htmlFor`; DOB date input (`:318`) has no `<label>` at all. Dozens of fields in a mandatory flow. **Fix:** thread `id`/`htmlFor`. Bundle with A11Y-1. **Effort:** S.

### A11Y-7 — No `prefers-reduced-motion` handling (MEDIUM, XS fix)
- No `@media (prefers-reduced-motion: reduce)` anywhere, but scale/translate/slide/blink/shimmer animations are pervasive. **Fix:** one global block in `globals.css` reducing animation/transition durations; gate the `scrollTo({behavior:'smooth'})` calls (`questionnaire/page.tsx:1573,1580`). **Effort:** XS.

### Lower-severity
- M5: inconsistent heading levels across the three recommendation cards; the Nutrition card's top block is a `<p>` not a heading (`NutritionRecommendationCard.tsx:199`). Verify the recommendation route renders an `<h1>`.
- `components/CompareView.tsx` is a 21-line stub — confirm it's dead code, not on a user path.
- Repeated non-descriptive "Shop Now" links + no "opens in new tab" cue on `AffiliateButton` / source links.
- Decorative glyphs (✓, +/−) lack `aria-hidden`.

### A11Y launch gate
Fix before launch (all XS–S): **A11Y-1** (auth labels), **A11Y-2** (auth `role="alert"`), **A11Y-7** (reduced-motion), and the **minimum** of A11Y-3 (Escape + initial focus on drawers/modals). Fast-follow: A11Y-4 (Compare dropdown) and A11Y-5 (questionnaire semantics) — both in the core funnel. Overall the app is in reasonable a11y shape; gaps cluster in auth label/error wiring and custom-widget ARIA.
