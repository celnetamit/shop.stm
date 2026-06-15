# Implementation Plan — Remaining Hardening & Refactors

**Date:** 2026-06-15 · **Companion to:** `ANALYSIS_REPORT.md`
**Goal:** finish the open items so the app is bug-free, most secure, less vulnerable to future change, lower-maintenance — **with zero downtime, no runtime conflicts, and no code conflicts.**

## How this plan honors the constraints (guiding principles)
1. **Tests before refactor.** Characterization tests capture today's *correct* behavior first, so the money-path refactor (Phase 2) is provably regression-free.
2. **Single source of truth.** Collapse the 3 divergent pricing/GST/coupon implementations into one pure module → less future vulnerability, less maintenance.
3. **Zero-downtime data changes only.** Any schema change is **additive** and follows **expand → migrate → contract** (never drop/rename in the same deploy). Sequences/indexes created `IF NOT EXISTS`.
4. **No code conflict.** Phases run sequentially on one branch as **small atomic commits**; where work is parallelizable it's split across **disjoint file sets** (mapped below). Money-path edits are done by one author, behind tests.
5. **Hard verification gates.** Every phase ends green on `npx tsc --noEmit` + `npm run build` + `npm run lint` (0 errors) + `npm test`. Each phase = one revertable commit.
6. **De-risk rollouts with flags.** Behaviour-changing money/auth paths ship behind an env flag (default = current behaviour) so production can flip them on after a canary, and roll back instantly without a redeploy.

---

## Phase 0 — Activate N1/N2 in the environment (prerequisite; ops action)
**Why:** the N1/N2 *code* is merged and verified, but inert until the DB columns exist and the webhook is registered.
- `prisma db push` (the Dockerfile already runs this on container start) → adds the additive `ProformaQuote.piNumber` column and the two unique indexes. Additive ⇒ zero downtime. The `razorpayOrderId` unique index requires existing values to be unique (they are, per the prior dedup); nulls allowed.
- Set `RAZORPAY_WEBHOOK_SECRET`; register `https://<domain>/api/webhooks/razorpay` (events `payment.captured`, `order.paid`).
- **Verify on staging:** create a quote (gets `PRO-<year>-<n>`), replay a webhook (Razorpay dashboard "test"), confirm idempotent order handling.
- **Rollback:** none needed (additive). If the unique index fails on duplicates, dedup first, then re-push.
- **Owner:** you (needs prod DB + Razorpay dashboard). **Size:** S.

## Phase 1 — Test harness + characterization tests (regression safety net) ✅ DONE
**Status (2026-06-15):** Vitest 4 + 22 tests across 5 files (pricing/pi-number/rate-limit/api-error/register-route); `lib/pricing.ts` extracted (orders route wired to it, behavior-preserving); blocking `Test` step in CI. Verified: `npm test` 22/22 · `tsc` 0 · `build` 33/33 · lint 0 · audit 0 vulns. The money-math spec now guards Phase 2.

**Why first:** locks current behavior so Phase 2's refactor is safe; gives every later phase a guard.
- Add **Vitest** (`vitest`, `@vitest/coverage-v8`) + `vitest.config.ts` + `npm test` script. Node environment; no DB required for unit tests (mock Prisma).
- **Pure unit tests (high value, zero infra):**
  - `lib/pi-number` — `resolvePiNumber` prefers stored, falls back; `formatPiNumber` stable.
  - `lib/rate-limit` — window, limit, reset, retry-after.
  - `lib/api-error` — generic message, never leaks `error.message`.
  - **Money math** — extract the orders route's subtotal/discount/per-item-GST/total into a pure function (small pre-refactor) and snapshot known cases (PRINT vs digital, COLLEGE/EXISTING_PI exemption, USD, discount clamp). This becomes the spec Phase 2 must preserve.
  - `resolveCouponDiscount` — active/window/maxUses/minOrder, FIXED vs PERCENTAGE, per-user cap, MANISH10 fallback.
- **Route tests (mock `@/lib/prisma`, `@/lib/auth/session`):** register role allow-list (C2), pi-search own-scope (H5), orders amount-reconciliation reject + P2002 idempotency (C1/N2), proforma PATCH 404/owner (H2).
- **CI:** add a `test` job (or step) to `.github/workflows/ci.yml` — blocking.
- **Verify:** `npm test` green; CI green. **Rollback:** delete test files (no runtime impact). **Conflict risk:** none (new files). **Size:** M.

## Phase 2 — Centralize pricing / GST / coupon logic (the big "future-proof" win) ✅ DONE
**Status (2026-06-15):** `lib/pricing.ts` is now the single source of truth. `computeTotals` is used by the orders route, `proforma/[id]` GET, `proforma-email-helper`, and `checkout-client`. The GST *rule* (`gstRateFor`/`isDigitalPlan`) is defined once and used by `computeTotals` **and** the proforma builder client (which keeps its own per-row, fractional issue-wise display model — forcing it through `computeTotals` would round per-item and change the preview, so only the rule was shared). `computeTotals` discount rounding aligned to 2-decimal (safe for integer order discounts; matches the percentage-based quote/email/checkout). Behavior-preserving — verified by 23 tests (incl. a fractional-discount case) + `tsc`/`build`/`lint`/`audit` all green.

**Why:** three copies exist (orders route, `proforma/[id]` GET, `proforma-email-helper`, plus the checkout client) and they already diverged once (the flat-18% bug). One module = bugs fixed once, future changes safe.
- New **`lib/pricing.ts`** — pure, dependency-free, currency/plan/exemption-aware:
  - `computeTotals({ items, currency, subscriberCategory, discountAmount })` → `{ subtotal, discount, taxable, cgst, sgst, total }` using the per-item digital-only, INR-only, exemption-aware GST rule (the one already in the orders route).
  - Keep `resolveCouponDiscount` as the server-only coupon resolver (it needs Prisma) calling into the pure discount math.
- **Refactor to use it (one at a time, tests green after each):** `app/api/orders/route.ts`, `app/api/proforma/[id]/route.ts`, `lib/proforma-email-helper.ts`, and the client `app/checkout/checkout-client.tsx` + `app/get-proforma-invoice-quote/proforma-quote-client.tsx` (import the *pure* `computeTotals`; client keeps no separate formula).
- **Money normalization:** do the math in integer paise inside `computeTotals`, round once → removes float drift (M-tier cleanup) without changing displayed values (tests assert parity).
- **Verify:** Phase 1 characterization tests must stay green (this is the whole point). `tsc`/`build`/`lint`.
- **Rollback:** revert the single commit; the old inline math is preserved in git. **Conflict risk:** touches commerce routes only (disjoint from admin/auth work). **Size:** M–L.

## Phase 3 — Server-authoritative pricing / IDs-only checkout (H7 full) ✅ DONE (quote path) · Phase 3b pending (cart)
**Status (2026-06-15):** Quote-linked checkout is now fully **server-authoritative**. New pure `quoteTotals(quote)` derives the amount from the quote's OWN stored items + locked `couponPercent`; `razorpay-order` (the amount charged) and the orders route (the recorded total + reconciliation) both use it for quote checkouts, so client-posted unit prices are never trusted — amount charged = displayed = recorded. `proforma/[id]` GET and the email helper were also routed through `quoteTotals` (more dedup). `razorpay-order` requires a session + ownership for quotes. 25 tests green (incl. 2 `quoteTotals` cases); `tsc`/`build`/`lint`/`audit` clean. No flag needed (behavior-preserving for legitimate users — Phase 2 made client/server pricing identical).
**Phase 3b ✅ DONE (2026-06-16):** The cart path now floors each item's price at the **authoritative catalog price** server-side. New pure `makeCatalogPriceLookup(catalog)` (+ async `buildCatalogPriceLookup`) in `lib/journal-catalog.ts` matches a cart item by **ISSN** (then normalized name, stripping the `(issue)` suffix) and coerces the catalog price (which may be a string) to a number. The orders route rejects any cart item priced clearly below catalog; **unmatched items or a catalog-load failure degrade to no validation, so a legitimate order is never falsely rejected** (no flag needed). 3 pure tests cover ISSN/name match + coercion + the unmatched/null case. `tsc`/test (32)/build/lint green.

**Why:** the client still computes the amount; the server reconciles (C1) but should *originate* the number. Depends on Phase 2.
- `razorpay-order` route: accept `{ quoteId }` or `{ items:[{id,plan,qty,year}], couponCode }`, **look up unit prices server-side** from the catalog/quote, compute the amount via `lib/pricing`, and build the Razorpay order from *that* (never `body.amount`). Require a session.
- `checkout-client`: send only identifiers (ids/plan/qty/`quoteId`/`couponCode`) — no money fields.
- Ship behind `PRICING_SERVER_AUTHORITATIVE=true` flag during rollout; old path stays until the flag flips.
- **Optional sub-step (enables full webhook-driven orders):** create a **PENDING** order at intent time keyed by `razorpayOrderId`; `/api/orders` and the webhook both flip PENDING→PAID. Makes a closed-tab payment fully self-healing (today it only alerts).
- **Verify:** tests for "client cannot under/over-ride amount"; manual Razorpay test-mode checkout. **Rollback:** flip the flag. **Conflict risk:** commerce routes (same set as Phase 2 — sequence after it). **Size:** L.

## Phase 4 — N6 USD end-to-end ✅ DONE (gated)
**Status (2026-06-15):** Checkout is now currency-aware end-to-end (display symbol, `razorpay-order` currency, recorded order currency all follow the quote). USD online payment is gated behind `ENABLE_USD_CHECKOUT` (default **off**): when off, USD quote checkout is **blocked gracefully** ("contact us") instead of the previous bug of charging the USD figure as rupees; when on (after enabling Razorpay international payments on the account), it charges in USD. Cart is INR-only. USD math (GST=0) is covered by the `quoteTotals` tests. `tsc`/test/build/lint green. **Activation:** set `ENABLE_USD_CHECKOUT=true` once the Razorpay account supports international payments.

**Why:** checkout hardcodes INR; USD quotes are mis-charged. Depends on Phases 2–3.
- Plumb `currency` through `razorpay-order` (create the Razorpay order in the quote's currency) and record it; `computeTotals` already returns GST=0 for USD.
- **Gating:** requires **Razorpay international-payments enabled on the account** (business decision). Keep behind `ENABLE_USD_CHECKOUT` flag; default off.
- **Verify:** unit tests (USD ⇒ GST 0, correct paise/cents); manual test once the account supports it. **Size:** M.

## Phase 5 — Admin authority re-derivation (security hardening) ✅ DONE
**Status (2026-06-15):** New `lib/auth/guards.ts` with `requireAdmin()` / `requireSession()`. `requireAdmin()` **re-derives the role from the DB** on every request (not the JWT), so a demoted/deleted admin loses access immediately. Applied to all **18** admin API handlers across 15 route files (uniform replacement of the `getCurrentSession()` + `session.role !== "ADMIN"` pattern). 4 guard tests lock the behavior (stale JWT ADMIN role → denied when DB role changed). `tsc`/test (29)/build/lint green. **Deferred (noted in code):** `User.tokenVersion` for single-session/stolen-cookie revocation (needs auth-core plumbing + a migration) and shorter JWT/refresh — `requireAdmin`'s DB check already closes the stated demotion hole, so these are optional refinements. Middleware (edge runtime) keeps its JWT pre-check; the API routes are now the authoritative DB-backed gate.

**Why:** admin routes trust the role baked into a 7-day JWT — a demoted/removed admin keeps access until expiry; no revocation. Independent of pricing (different files ⇒ can run in parallel with Phase 2–4 if desired).
- Add **`lib/auth/guards.ts`**: `requireSession()` / `requireAdmin()` that re-derive authority **per request** — load the user by `session.sub`, confirm `role === ADMIN` **and** `isAdminEmail(user.email)` before allowing admin actions.
- Add an additive **`User.tokenVersion Int @default(0)`** column; embed it in the JWT; reject tokens whose version is stale → instant logout/revocation. (Expand-only migration.)
- Shorten the auth token to ~24h with a refresh, or accept the `tokenVersion` check as the revocation mechanism.
- Replace the repeated `getCurrentSession()+role` checks in every `app/api/admin/*` route with `requireAdmin()` (also folds in the admin-only `errorResponse` rollout — polish item).
- **Verify:** route tests (demoted admin blocked; stale tokenVersion rejected). **Rollback:** revert commit; column stays (harmless). **Conflict risk:** auth + admin routes (disjoint from commerce). **Size:** M–L.

## Phase 6 — Low-risk polish (batchable, mostly disjoint files) ✅ DONE
**Status (2026-06-16):** **M6** — `invalidateCatalogCache()` (journal-catalog) + `invalidateChatbotCatalogCache()` (chatbot) now called from the admin journal save (`/api/admin/journals` POST) and delete (`[id]` DELETE), alongside the existing `revalidatePath`. **L4** — `htmlFor`/`id` + `aria-label`/`aria-required` on the login & register forms; keyboard (Enter/Space) handlers added to the product-detail plan cards. **L5** — proforma subscription years derive from `new Date().getFullYear()` (default, add-config wrap, and the year `<select>` options). **Breadcrumb** — created `app/product-category/journals/page.tsx` (redirects to `/catalogues-list`), fixing the 404 (build now 34 pages). **Admin loading/error** — `admin-dashboard` load wrapped in try/catch with a loading indicator and error message (no more blank UI on a network error). Verified: `tsc` 0 · test 32 · build 34/34 · lint 0 errors.

**Original notes:** Independent, can be interleaved or done last; each is its own small commit.
- **Admin-only `errorResponse` rollout** (folded into Phase 5 if done together).
- **M6 catalog cache invalidation** — add TTL / `revalidateTag('catalog')`; call an `invalidateCatalogCache()` from the admin journal save/delete routes. (`lib/journal-catalog.ts` + `app/api/admin/journals/*`.)
- **L4 accessibility** — `htmlFor`/`id` on the auth/checkout/proforma forms; keyboard handlers on `role="button"` cards.
- **L5** — derive subscription years from `new Date().getFullYear()` in the proforma client.
- **Breadcrumb dead links** — create `app/product-category/journals/page.tsx` or repoint the crumb.
- **Admin loading/error states** — wrap dashboard/admin fetches in try/catch + `loading`/`error` UI; check mutation responses.
- **Verify:** `tsc`/`build`/`lint`; quick manual smoke. **Size:** S each.

---

## Sequencing & conflict map (why phases don't collide)
| Phase | Primary files | Disjoint from |
|---|---|---|
| 1 Tests | `*.test.ts`, vitest config, CI | everything (new files) |
| 2 Pricing | `lib/pricing.ts`, orders/proforma commerce routes, checkout clients | admin/auth (P5), polish (P6) |
| 3 IDs-only | `razorpay-order`, checkout client, orders | admin/auth |
| 4 USD | `razorpay-order`, pricing | admin/auth |
| 5 Admin auth | `lib/auth/*`, `app/api/admin/*`, middleware | commerce (P2–4) |
| 6 Polish | catalog lib, admin journal routes, UI pages | commerce money path |

**Recommended order:** 0 → 1 → 2 → 3 → (4 when Razorpay USD is enabled) → 5 → 6.
Phases **2–4** (commerce) and **5** (auth) touch disjoint file sets, so 5 may proceed in parallel on a separate commit if you want two tracks — but single-track sequential is the safest for "no conflict."

## Effort / risk summary
| Phase | Size | Runtime risk | Needs deploy/ops | Schema change |
|---|---|---|---|---|
| 0 Activate | S | low | yes (db push, webhook) | applies N1/N2 (additive) |
| 1 Tests | M | none | no | no |
| 2 Pricing | M–L | medium (behind tests) | no | no |
| 3 IDs-only | L | medium (flagged) | no (flag flip) | optional (PENDING order) |
| 4 USD | M | medium (flagged) | Razorpay capability | no |
| 5 Admin auth | M–L | low–medium | no | additive `tokenVersion` |
| 6 Polish | S×N | low | no | no |

## Definition of done (per phase)
`npx tsc --noEmit` = 0 · `npm run build` = 0 (33/33) · `npm run lint` = 0 errors · `npm test` green · one atomic commit · report appendix updated · any deploy step documented.
