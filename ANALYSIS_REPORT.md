# STM Journals Shop — Codebase Analysis & Remediation Report

**Stack:** Next.js 15 (App Router) · React 19 · Prisma 6 / PostgreSQL · AWS SES · Razorpay · JWT (jose) · bcryptjs
**Date:** 2026-06-15
**Scope:** Full codebase audit (auth, payments/commerce, email/PDF, libs/data, frontend, build/config) followed by direct remediation of the highest-impact issues.

Each item is tagged **[FIXED]** (applied in this pass) or **[RECOMMENDED]** (documented, not yet applied — usually because it needs a product decision, a schema migration, or a build/test environment).

---

## 1. Detected bugs & issues, 2. Root causes, 3. Recommended fixes

### 🔴 CRITICAL

#### C1 — Payment amount was never reconciled against the paid Razorpay amount **[FIXED]**
- **Files:** `app/api/orders/route.ts`, `app/api/checkout/razorpay-order/route.ts`
- **Issue:** The order endpoint verified the Razorpay HMAC signature and recomputed totals from posted items, but never compared the **amount actually captured by Razorpay** to the server total. The Razorpay order amount was set from a **client-supplied** `amount`. Exploit: create a ₹1 Razorpay order → pay ₹1 → POST the real full-price item list → a `status: PAID`, full-price order is created.
- **Root cause:** An HMAC signature proves "this payment belongs to this order id" — not the amount. Two independent amounts (client intent vs. server total) were never tied together.
- **Fix applied:** After signature verification, the order route now fetches the Razorpay order (`rzp.orders.fetch`) and rejects if `amount_paid` is less than the server-computed total (1-unit rounding tolerance). It also recomputes GST per-item (see C3) so the comparison is accurate.
- **Further hardening [RECOMMENDED]:** Move authoritative pricing into `razorpay-order/route.ts` (derive the amount from `quoteId`/cart server-side instead of trusting `body.amount`) and drive order creation from a **Razorpay webhook** rather than the browser callback.

#### C2 — Privilege escalation via self-service `role` on registration **[FIXED]**
- **File:** `app/api/auth/register/route.ts`
- **Issue:** Registration accepted a client `role` and persisted it directly. Only `ADMIN` was gated; `MANAGER` (which `middleware.ts` grants `/admin` access) and arbitrary strings were self-assignable.
- **Root cause:** Trusting a client privilege field validated only by an (erased-at-runtime) TypeScript type.
- **Fix applied:** Role is now validated against an allow-list of non-privileged self-service roles (`USER, LIBRARIAN, AGENCY, STUDENT, SCHOLAR`); anything else falls back to `USER`. `ADMIN` still comes solely from the server `ADMIN_EMAILS` list.

#### C3 — Discount & GST were client-controlled (free/under-priced orders) **[FIXED]**
- **File:** `app/api/orders/route.ts`
- **Issue:** `discount` was taken verbatim from the client (could equal the whole subtotal → ₹0 order), and GST was a flat 18% on everything — inconsistent with the quote/checkout (per-item, digital-only, exemption-aware), so the recorded total/invoice was wrong.
- **Root cause:** Discount treated as input rather than derived; duplicated, divergent tax logic.
- **Fix applied:** Added `resolveCouponDiscount()` which re-validates the coupon server-side (active / window / `maxUses` / `minOrderAmount`, incl. the `MANISH10` fallback) and computes the discount from `type`+`value`. Coupon source is the linked proforma's stored code when present, else the posted code. GST is now computed per-item mirroring the checkout/quote logic. Client `body.discount`/`cgst`/`sgst`/`total` are ignored.

#### C4 — Stored HTML/script injection into customer & admin emails **[FIXED]**
- **Files:** `lib/proforma-email-helper.ts`, `lib/email.ts`, `app/api/proforma/[id]/route.ts`
- **Issue:** `journalName` (attacker-controllable via the proforma PATCH) was interpolated **raw** into the email items table. `email.ts`'s `replaceTemplate` deliberately skips escaping for any data key ending in `html`, so the payload reached customer and **admin** inboxes unescaped.
- **Root cause:** Treating DB-derived item names as trusted HTML; escaping policy keyed on a field-name suffix.
- **Fix applied:** Added an `esc()` helper in `proforma-email-helper.ts` and escaped `journalName`, `selectedPlan`, `hsn`, and the coupon code before interpolation. Also hardened the proforma PATCH (see H2).

#### C5 — `dangerouslySetInnerHTML` on cloned remote HTML behind a bypassable denylist **[FIXED]**
- **Files:** `lib/clone-service.ts`, `app/[...slug]/page.tsx`
- **Issue:** Remote HTML from `SOURCE_SITE_URL` was rendered with `dangerouslySetInnerHTML` after a hand-rolled cheerio **denylist** sanitizer that missed `style` attributes, `data:`/`vbscript:` URLs, `<base>`, `srcset`, entity-encoded `javascript:`, SVG/MathML script vectors, etc. If the source is ever compromised/influenced, script runs in the app origin (can steal the admin cookie).
- **Root cause:** Re-serving third-party HTML through a custom denylist instead of a vetted allow-list sanitizer.
- **Fix applied:** Added `isomorphic-dompurify` and a `sanitizeClonedHtml()` allow-list pass appended to `rewriteHtml()` (runs on both the cache-write and render-read paths). Cheerio still does the transformations (link rewriting, header removal, image absolutization); DOMPurify is now the security boundary — it strips `<script>` (incl. inside SVG), all event handlers, `javascript:`/dangerous-scheme URLs, `<base>`, `<iframe>`/`<object>`/`<embed>`/`<form>`, while **preserving presentation** (`<style>`, `<link rel=stylesheet>`, inline `style`, `<img>`/`srcset`, internal links). Verified with a 13-case behavior test (all pass) and a clean `tsc`/`next build`. A try/catch falls back to the cheerio-stripped HTML if sanitization ever throws. Scope is limited to the `[...slug]` mirror page + admin sync route (the homepage does not use it, so no added latency there).

#### C6 — Real secrets committed in `.env.example` **[FIXED in file] / [ACTION REQUIRED: rotate]**
- **File:** `.env.example`
- **Issue:** The committed example contained a real-looking `JWT_SECRET` and `GOOGLE_CLIENT_SECRET` (and client id / admin emails). Anyone with repo access could forge admin JWT cookies.
- **Fix applied:** Replaced all values with placeholders and documented every required env var.
- **ACTION REQUIRED (cannot be done from code):** **Rotate** `JWT_SECRET` (`openssl rand -base64 32`) and the **Google OAuth client secret** in Google Cloud Console — they must be considered compromised. Then purge them from git history (`git filter-repo` / BFG), since editing the file does not remove them from past commits.

#### C7 — 312 MB committed broken build artifact + data dumps **[FIXED (current tree) / history rewrite still pending]**
- **Files:** `.next_broken_20260508_1015/` (~312 MB, 295 files), root PDFs/CSVs/JSON/images.
- **Issue:** A renamed stale `.next` build and ~22 MB of PDFs/CSVs/images bloat every clone; `.gitignore` only ignored literal `.next`.
- **Fix applied:** Rewrote `.gitignore` to cover `.next_broken_*`, `*.tsbuildinfo`, `.env*.local`, the test PDFs/PNG, logs, coverage, editor dirs, `scratch_*`. Then committed the removal (local commit `ffae78d`, **not pushed**): untracked the 295-file build dir and deleted it from disk; untracked `tsconfig.tsbuildinfo` + `PI-test.pdf` + `PI-test-view.png` + `Proforma_PRO-2026-4241.pdf` (kept on local disk). Verified: no real source was touched, and the load-bearing `journal-price.json` / `journals_entry.csv` (COPYed by the Dockerfile) remain tracked. The commit is scoped — it does not include the other in-flight code fixes.
- **STILL PENDING (manual, destructive):** This stops future tracking but does **not** shrink existing git history. To reclaim the 312 MB already in history, run a `git filter-repo`/BFG rewrite and force-push (rewrites history — coordinate with anyone else on the repo). Also consider moving `journal-price.json` / `journals_entry.csv` into a `data/` dir (and updating the Dockerfile COPY paths).

### 🟠 HIGH

#### H1 — No rate-limiting on login / OTP (brute-force, email-bombing, LLM cost abuse) **[FIXED]**
- **Files:** `app/api/auth/login/route.ts`, `app/api/auth/email-otp/send/route.ts`, `app/api/chat/message/route.ts`, new `lib/rate-limit.ts`
- **Issue:** Login allowed unlimited password attempts; OTP send had no throttle and reset the attempt counter on every resend (defeating the verify-side 5-attempt cap); the unauthenticated chatbot triggered a paid LLM call per request with no limit.
- **Fix applied:** Added a dependency-free in-memory limiter. Login: 10/5min per IP+email. OTP send: 15/15min per IP **plus** a 60s resend cooldown. Chat: 20/min per IP **plus** a 2,000-char message cap.
- **Note [RECOMMENDED]:** In-memory limits are best-effort and per-instance; back them with Redis/Upstash for hard multi-instance guarantees.

#### H2 — IDOR / missing-row handling on proforma quotes **[FIXED]**
- **Files:** `app/api/proforma/[id]/route.ts`, `app/api/proforma/[id]/subscriber/route.ts`
- **Issue:** PATCH proceeded even when the quote didn't exist (→ unhandled 500 leak); ownership was "deny only if owner set & differs", so null-owner (anonymous) quotes were editable by any logged-in user. The subscriber PATCH lacked the admin allowance.
- **Fix applied:** Both PATCH routes now return 404 when the quote is missing and allow only the owner or `ADMIN`. The `subscriber` route is also the "claim" path (sets `createdByUserId` on first authenticated edit), so an as-yet-unowned quote is still claimable by its first authenticated editor — that intended flow is preserved while cross-user takeover of an already-owned quote is blocked. Errors are now generic.
- **RECOMMENDED (residual):** Decide a policy for legitimately anonymous quotes (e.g., bind owner at creation when a session exists) and scope `pi-search` PII (H5).

#### H3 — SSRF in the clone/sync fetch **[FIXED]**
- **Files:** `lib/clone-service.ts`, `app/api/sync/route.ts`
- **Issue:** `getClonedPath(path)` fetched `SOURCE_SITE_URL + path` with `path` passed through admin `/api/sync`; `normalizePath` allowed `//evil.com`, `/../`, `@`, schemes.
- **Fix applied:** `normalizePath` now rejects protocol-relative `//`, traversal, `@`, backslashes, CR/LF and absolute schemes; `toAbsoluteUrl` asserts the resolved origin equals the source origin.
- **RECOMMENDED:** Also set `redirect: "manual"` (or validate each redirect hop) and cap the response body size.

#### H4 — Email header injection via MIME attachment filename **[FIXED]**
- **File:** `lib/email.ts`
- **Issue:** Raw MIME assembly interpolated `att.filename`/`contentType`/`to`/`subject` unescaped — a CR/LF in any of them injects arbitrary headers/parts.
- **Fix applied:** Added `sanitizeHeaderValue()` (strips CR/LF) applied to `to`, `subject`, attachment `filename` and `contentType` (quotes also removed).

#### H5 — PII over-exposure in `pi-search` **[FIXED]**
- **File:** `app/api/proforma/pi-search/route.ts`
- **Issue:** Any logged-in user could search **all** customers' org/contact/email/phone/address/GST.
- **Fix applied (product decision):** Non-admin searches are now AND-scoped to the caller's **own** PIs (`createdByUserId === session.sub` OR `email === session.email`), so the "find your existing PI" renewal flow still works (and still prefills full data for *your* records) but other institutions' PII can no longer be harvested. Admins keep the global lookup. Applied to both the primary and the legacy-column fallback query.

#### H6 — Lazy template seeding clobbered admin edits; admin notify was fail-fast **[FIXED]**
- **File:** `lib/email.ts`
- **Issue:** On a template cache-miss the send path called `seedDefaultTemplates()` whose `upsert` **overwrote** every admin-edited template. `sendAdminNotification` used `Promise.all` (one failure aborts the rest).
- **Fix applied:** `seedDefaultTemplates({ createOnly: true })` on the hot path (create missing only, never overwrite); the admin "sync" route keeps force-overwrite. `sendAdminNotification` now uses `Promise.allSettled`.

#### H7 — Client-trusted pricing in the checkout/proforma UI **[PARTIALLY FIXED]**
- **Files:** `app/checkout/checkout-client.tsx`, `app/get-proforma-invoice-quote/proforma-quote-client.tsx`
- **Issue:** The amount and all money fields are computed in the browser (including a `?total=` URL fallback) and posted to the server.
- **Mitigation applied:** The **server** now ignores client money fields and reconciles against the actually-paid amount (C1/C3), so client tampering can no longer under-charge.
- **RECOMMENDED:** Send only identifiers (item ids, plan, qty, `quoteId`, `couponCode`) and remove the `?total=` fallback path; block payment when a `quoteId` is present but the quote failed to load.

#### H8 — Running a Next.js version with known security advisories **[FIXED]**
- **File:** `package.json` (`next` was 15.5.15)
- **Issue:** `npm audit` reported the installed Next.js had multiple **high**-severity advisories, several directly relevant to this app: App-Router **middleware/proxy bypass** (this app enforces page auth in `middleware.ts`), cache-poisoning, and XSS variants. Also a moderate `postcss` advisory (transitive via Next).
- **Root cause:** Dependency drift; no automated dependency/audit gating.
- **Fix applied:** Upgraded `next` and `eslint-config-next` **15.5.15 → 15.5.19** (latest patched 15.x — deliberately stayed within the major to avoid breaking changes; a 16.x jump was rejected). The transitive `postcss` was forced to `^8.5.15` via a `package.json` `overrides` entry (note: `npm audit fix --force` was **not** used — it would have catastrophically downgraded Next to 9.3.3). Result: **`npm audit` → 0 vulnerabilities**, with `tsc` and `next build` still passing (33/33 pages). Backups of `package.json`/`package-lock.json` were taken during the upgrade and the upgrade verified before removing them.
- **RECOMMENDED (follow-up):** Add `npm audit --audit-level=high` to CI plus Dependabot/Renovate so this doesn't drift again.

### 🟡 MEDIUM

#### M1 — Internal error messages leaked to clients **[FIXED across hot paths]**
- **Files:** login, register, orders, sync, proforma `[id]`, chat message, OTP send/verify, chat history.
- **Fix applied:** These now `console.error` the detail server-side and return a generic message.
- **RECOMMENDED:** Apply the same to the remaining `error.message`-echoing admin routes (`admin/users`, `admin/orders/[id]`, `admin/proforma/[id]`, `admin/email-templates`, `coupons/validate`, etc.).

#### M2 — Open-redirect logout via forwarded headers **[FIXED]**
- **File:** `app/api/auth/logout/route.ts`
- **Fix applied:** Redirect target is built from `NEXT_PUBLIC_APP_URL` (or the request's own origin), never from `X-Forwarded-*`/`Host`.

#### M3 — Weak hardcoded OTP secret + non-constant-time compare **[FIXED]**
- **Files:** `app/api/auth/email-otp/send|verify/route.ts`
- **Fix applied:** OTP hashing falls back to the mandatory `JWT_SECRET` (throws if no secret) instead of a public literal; verification uses `crypto.timingSafeEqual`.

#### M4 — Cart `removeItem`/`setQty` keyed on `id` only (variant collisions) **[FIXED]**
- **Files:** `app/components/cart-store.tsx`, `app/cart/page.tsx`
- **Issue:** `addItem` deduped on `(id, plan, year)` but remove/setQty matched on `id`, so editing one variant hit all variants; duplicate React `key`.
- **Fix applied:** Added `lineKey(item)` = `id::plan::year`; add/remove/setQty and the React `key` all use it.

#### M5 — Search fetch race + unhandled rejection; Razorpay script unmount crash **[FIXED]**
- **Files:** `app/components/site-shell.tsx`, `app/checkout/checkout-client.tsx`
- **Fix applied:** Search now uses an `AbortController` (cancels superseded requests) with a `.catch`; the Razorpay loader guards against double-injection and `removeChild` on an already-removed node.

#### M6 — Other documented mediums **[RECOMMENDED]**
- Module-level catalog caches never invalidate after admin edits → add a TTL / `revalidateTag`.
- `findProformaQuote` linear-scans the latest 1,000 quotes by recomputed PI number → store an indexed PI column (see N1).
- Theme FOUC (dark mode flashes light) → inline blocking theme script + `suppressHydrationWarning`.
- localStorage written on every keystroke before prefill completes → add a `didInit` guard + debounce.
- Proforma auto-email effect can double-fire → use a one-shot `useRef` latch keyed by `quoteId`.

### 🟢 LOW

- **L1 — Invoice typo** "ODER PLACEED BY" → "ORDER PLACED BY". **[FIXED]**
- **L2 — ESLint was a no-op** (`rules:{}`, no `extends`). **[FIXED]** now extends `next/core-web-vitals` + `next/typescript`. (Pin a single ESLint major and run `npm i` to validate.)
- **L3 — `chat/history` had no try/catch** (crashed on DB error). **[FIXED]**
- **L4 — Accessibility:** placeholder-only inputs / `<label>` not linked to inputs; click-only `role="button"` cards lack keyboard handlers. **[RECOMMENDED]**
- **L5 — Hardcoded years (2024–2027/2025 default)** in proforma. **[RECOMMENDED]** derive from `new Date().getFullYear()`.
- **L6 — Stray debug/seed scripts at repo root** (`test-*.js`, `scratch_*`, duplicated `.ts/.js`). **[RECOMMENDED]** move to `scripts/` or delete (now covered by `.gitignore`).
- **L7 — `createSimplePdf` escaping** doesn't strip control/non-Latin-1 chars and truncates long invoices. **[RECOMMENDED]**
- **L8 — `clone-service` no-op ternary** `el.tagName === "a" ? "href" : "href"`. **[RECOMMENDED]** harmless; clean up.

---

## 4. Security improvements (summary)
**Applied:** payment-amount reconciliation; server-validated coupon/discount + correct per-item GST; registration role allow-list; email HTML-escaping; MIME header-injection guard; SSRF origin pinning; rate-limiting (login/OTP/chat) + OTP cooldown; constant-time OTP compare + stronger OTP secret; open-redirect-safe logout; proforma IDOR/404 hardening; generic error responses on hot paths; secrets removed from `.env.example`.
**Recommended next:** rotate the leaked secrets and purge history (C6); DOMPurify/iframe-sandbox the cloned HTML (C5); scope `pi-search` PII (H5); add CSRF/Origin checks on mutation routes; re-derive admin authority per request (don't trust a 7-day JWT role claim) and shorten token lifetime / add revocation; move order creation to a Razorpay webhook.

## 5. Usability improvements
**Applied:** correct invoice label; correct cart variant edit/remove; resilient search (no stuck "Searching…", no stale results); no checkout crash on remount; admin email-template edits no longer silently reverted.
**Recommended:** fix dark-mode FOUC; add loading/error states to admin/dashboard fetches; check mutation responses before optimistic UI; fix breadcrumb dead links (`/product-category/journals` has no page); link `<label htmlFor>`/`id` and add keyboard handlers; derive subscription years from the current year.

## 6. Code-quality / refactoring
- **Centralize pricing/GST** in one shared module used by quote, cart, checkout, and orders (three divergent copies exist today).
- **Centralize coupon validation** (the discount/`type`/`value` logic is split across `coupons/validate`, `coupons/route`, cart, and orders; FIXED coupons are unhandled and `MANISH10` is hardcoded).
- **Normalize money to integer paise** end-to-end (float rupees + `×100` invites rounding drift).
- **Normalize catalog prices to numbers** at the CSV/JSON boundary (`JournalRow` declares `number` but sources strings).
- Add a shared `requireAdmin()`/`requireSession()` helper instead of repeating the session+role check in every admin route.
- Replace hand-rolled MIME/PDF with libraries (`nodemailer`/SES v2 structured attachments; `pdf-lib`).

## 7. Missing functionality / pending tasks
- **N1 — Persisted PI number [FIXED].** Added an additive, **nullable `piNumber String? @unique`** column. New quotes get a unique sequential number `PRO-<year>-<seq>` from a dedicated Postgres sequence (race-free; lazily/idempotently created, so it works with `db push`). Allocation is best-effort and resilient — if the column/sequence isn't ready it logs and falls back to the legacy derived format, so **no request fails**. Lookup (`findProformaQuote`) now resolves by the indexed `piNumber` directly (no scan, no collision) with the legacy hash-scan kept for old rows. A new pure `resolvePiNumber(quote)` helper (returns stored number, else legacy) is used across all 9 render sites + the creation/search APIs, so the on-screen preview, PDF, email, and admin views all show the same canonical number; legacy quotes keep their old numbers.
- **N2 — Razorpay webhook + idempotency [FIXED].** Added a **unique constraint on `Order.razorpayOrderId`** (additive) for DB-level idempotency, and the orders route now treats the `P2002` race as "already processed" (409). New **`/api/webhooks/razorpay`** route verifies the signature (constant-time) and, on `payment.captured`/`order.paid`, confirms the order idempotently (PENDING→PAID; already-PAID is acked) and **loudly alerts on a captured payment with no matching order** so a closed-tab payment is never silently lost. (Fully webhook-*driven* order creation — persisting a PENDING order with items at intent time — is the next enhancement; it needs live Razorpay testing.)
- **N3 — Admin coupon editing** can't set `type`/`value`/`validUntil`/`maxUses` (only the legacy `discount` int) → coupons get inconsistent.
- **N4 — CI added; tests still pending.** **[PARTIALLY FIXED]** Added `.github/workflows/ci.yml` (runs on push/PR + weekly: `npm ci` → `prisma generate` → `tsc --noEmit` → lint (non-blocking) → `next build`, plus a separate **`npm audit --audit-level=high`** gate that fails the build on high/critical advisories) and `.github/dependabot.yml` (weekly npm + github-actions updates, minor/patch grouped, majors of next/react held for manual review). Every step was verified locally (all green; audit 0 vulns). The CI **lint step is now blocking** (the pre-existing lint errors were cleared — see B1). **Still TODO:** add a Vitest/Jest suite (auth/middleware, proforma pricing, order-amount reconciliation) and wire it into the workflow; incrementally replace the remaining `any`s (now warnings) with concrete types. Also enable **Dependabot security alerts/updates** in repo *Settings → Code security*.
- **N5 — Per-user coupon usage cap** and atomic `usedCount` decrement (currently best-effort `.catch(()=>{})`).
- **N6 — USD checkout** is hardcoded to charge INR in `checkout-client.tsx` (`currency: "INR"`); reconcile currency handling end-to-end.

## 8. Prioritized implementation plan
**P0 — do immediately (mostly done in this pass):**
1. ✅ Payment reconciliation + server-side discount/GST (C1, C3).
2. ✅ Registration role allow-list (C2).
3. ✅ Email HTML-escaping + MIME header guard (C4, H4).
4. **Rotate** the leaked `JWT_SECRET` + Google secret and purge git history (C6) — *manual, still required*.
5. ✅ Rate-limiting on login/OTP/chat (H1).

**P1 — this week:**
6. DOMPurify or iframe-sandbox the cloned HTML (C5).
7. Scope `pi-search` PII (H5); finish IDOR allow-listing on `subscriber` (H2).
8. Remove the 312 MB build dir + data dumps from git and rewrite history (C7).
9. Re-derive admin authority per request; shorten JWT lifetime / add revocation.
10. Move order creation to a Razorpay webhook + idempotency (N2).

**P2 — this sprint:**
11. Centralize pricing/GST and coupon validation; normalize money to paise (code quality).
12. Persist indexed PI numbers (N1); admin coupon editing for `type`/`value`/limits (N3).
13. Add CI + smoke tests (N4); finish generic-error rollout (M1); cache invalidation (M6).

**P3 — polish:** FOUC, accessibility, loading/error states, breadcrumb links, year derivation, PDF hardening, repo hygiene for stray scripts.

---

## Appendix — files changed in this pass
- `app/api/orders/route.ts` — payment reconciliation, server-validated coupon discount, per-item GST, generic errors.
- `app/api/auth/register/route.ts` — role allow-list, generic error.
- `app/api/auth/login/route.ts` — rate limiting, generic error.
- `app/api/auth/email-otp/send/route.ts` — per-IP limit, resend cooldown, stronger secret, generic error.
- `app/api/auth/email-otp/verify/route.ts` — stronger secret, constant-time compare, generic error.
- `app/api/auth/logout/route.ts` — open-redirect-safe redirect.
- `app/api/proforma/[id]/route.ts` — 404 on missing, owner/admin check, generic error.
- `app/api/sync/route.ts` — generic error.
- `app/api/chat/message/route.ts` — rate limit, message cap, generic error.
- `app/api/chat/history/route.ts` — try/catch.
- `lib/email.ts` — MIME header sanitization, create-only seeding, `allSettled` admin notify.
- `lib/proforma-email-helper.ts` — HTML escaping of user values.
- `lib/clone-service.ts` — SSRF origin pinning / path validation.
- `lib/rate-limit.ts` — new in-memory rate limiter.
- `app/components/cart-store.tsx`, `app/cart/page.tsx` — composite line key.
- `app/components/site-shell.tsx` — search abort/catch.
- `app/checkout/checkout-client.tsx` — Razorpay script guard.
- `app/get-proforma-invoice-quote/proforma-quote-client.tsx` — invoice typo.
- `.env.example`, `.gitignore`, `.eslintrc.json` — secrets/hygiene/lint config.

### Second pass (P1 follow-ups)
- `lib/clone-service.ts` — DOMPurify allow-list sanitization of cloned HTML (C5).
- `app/api/proforma/[id]/subscriber/route.ts` — 404-on-missing + owner/admin allow-list + generic error (H2).
- `app/api/checkout/razorpay-order/route.ts` — lazy Razorpay init (build/cold-start safety) + generic error (B2).
- `next.config.ts` — `eslint.ignoreDuringBuilds` so the improved lint config doesn't block builds (B1).
- `package.json` — added `isomorphic-dompurify`; upgraded `next`/`eslint-config-next` to 15.5.19 and added a `postcss` override (H8). Final `npm audit`: **0 vulnerabilities**.
- `.github/workflows/ci.yml` — new CI: type-check + build job and a blocking `npm audit --audit-level=high` job (N4/H8 drift guard).
- `.github/dependabot.yml` — new: weekly npm + github-actions dependency update PRs.

### Third pass (security + product decisions + features) — all build/lint/tsc verified
- `lib/api-error.ts` — **new** shared `errorResponse()` helper (log full error server-side, return generic message). The future-proof, low-maintenance fix for M1.
- **M1** — applied the helper to all PUBLIC / any-authenticated-user routes: `proforma` (POST), `proforma/pi-search`, `proforma/pi-latest`, `contact-entries`, `coupons` (GET/POST), `coupons/validate`, `coupons/[id]` (GET/PATCH/DELETE), `domains`. (Admin-only routes still echo `error.message` to *authenticated admins* — low risk; mechanical follow-up with the same helper.)
- **H5** [FIXED] — `pi-search` scoped to the caller's own PIs (admins global).
- **H3 residual** [FIXED] — `clone-service` now blocks cross-origin redirects (reads `response.url`) and caps the response body at 8 MB via a streaming reader (`readBodyCapped`).
- **H7 residual** [FIXED] — removed the attacker-controllable `?total=` URL fallback in `checkout-client.tsx`; pricing comes only from the loaded quote/cart (server still reconciles).
- **N3** [FIXED] — `coupons/[id]` PATCH now edits `type`/`value`/`maxUses`/`minOrderAmount`/`validFrom`/`validUntil` (not just code/discount/isActive), keeping the legacy `discount` int in sync. (Admin UI inputs to expose these are an optional follow-up.)
- **N5** [FIXED] — per-user coupon cap (default 1) enforced authoritatively in the orders route's `resolveCouponDiscount` by counting prior PAID orders for that coupon by the same user/email — placed there (not at order-write) so it stays consistent with the payment reconciliation. No schema change.
- **M6** [PARTIAL] — dark-mode FOUC fixed via a blocking inline theme script + `suppressHydrationWarning` in `layout.tsx`; proforma auto-email now fires exactly once via a `useRef` one-shot latch. (Catalog cache invalidation still pending.)
- **L7** [FIXED] — `createSimplePdf` strips control chars + non-Latin-1 before escaping. **L8** [FIXED] — removed the no-op ternary in `clone-service`.
- **Verification:** `tsc --noEmit` exit 0 · `next build` 33/33 pages · `npm run lint` 0 errors.

### Fourth pass (N1 persisted PI number + N2 webhook/idempotency) — tsc/build/lint verified
New files: `lib/pi-allocator.ts` (server-only sequence allocator), `app/api/webhooks/razorpay/route.ts`. Schema: `ProformaQuote.piNumber String? @unique`, `Order.razorpayOrderId String? @unique`. Touched: `lib/pi-number.ts` (`resolvePiNumber`), proforma POST/[id]/subscriber/pi-search/pi-latest, orders route (idempotency), and all PI display sites (email helper, PDF attachment, account/admin pages, dashboard tabs, proforma client). Verified: `tsc` 0 · `next build` 33/33 (webhook route registered) · lint 0 errors.

**⚠️ Deploy steps (required for N1/N2 to activate — all zero-downtime):**
1. **Apply the additive schema** — `prisma db push` (the Dockerfile already runs this on container start). Adds the nullable `piNumber` column + the two unique indexes. Safe/additive; the `razorpayOrderId` unique index needs existing values to be unique (they are, given the prior dedup) — nulls are allowed.
2. **N1 sequence** — no action; created automatically on first quote creation.
3. **N2 webhook** — set `RAZORPAY_WEBHOOK_SECRET`, then in the Razorpay Dashboard add a webhook to `https://<domain>/api/webhooks/razorpay` for events `payment.captured` and `order.paid`. Until then, idempotency still works; only the safety-net confirmation/alerting is inactive.

### Fifth pass (Phase 1 of the plan: test harness + characterization tests) — verified
- **Vitest 4** added (`npm test` / `test:watch`) with `vitest.config.ts` (node env, `@` alias, `tests/`). Chose vitest 4 specifically so the dev toolchain is **0 audit vulnerabilities** (vitest 2/3 pull a flagged vite/esbuild; vitest 4 is clean) — the strict `npm audit --audit-level=high` gate stays full-tree.
- **New `lib/pricing.ts`** — the single source of truth for money math (`computeTotals`, `computeCouponDiscountAmount`, `computeSubtotal`, `isUnderpaid`), extracted from the orders route **behavior-preservingly** (the orders route now calls it). This is also the Phase-2 foundation.
- **22 tests / 5 files:** `pricing` (GST rule per plan/currency/exemption, discount-before-GST, clamp, coupon math, underpayment tolerance), `pi-number` (resolve prefers stored, falls back), `rate-limit` (limit/window/reset, IP parse), `api-error` (never leaks internals), `register-route` (C2 role allow-list — MANAGER/arbitrary → USER, LIBRARIAN allowed).
- **CI:** added a blocking `Test` step to `.github/workflows/ci.yml`.
- **Verified:** `npm test` 22/22 · `tsc` 0 · `next build` 33/33 · lint 0 errors · audit 0 vulns. The pricing tests now guard the Phase-2 refactor.

### Sixth pass (Phase 2: pricing/GST/coupon centralization) — verified
- `lib/pricing.ts` is now the **single source of truth** for money math. `computeTotals` is consumed by the orders route, `proforma/[id]` GET, `proforma-email-helper`, and the checkout client (replacing 4 divergent copies). The GST rule (`gstRateFor`/`isDigitalPlan`) is defined **once** and shared by `computeTotals` and the proforma-builder client.
- The proforma-builder client keeps its own per-row, fractional issue-wise display model (forcing it through `computeTotals`, which rounds each unit price to an integer, would change the preview) — only the GST *rule* was centralized there.
- `computeTotals` discount rounding aligned to 2 decimals (safe for integer order discounts; matches the percentage-based quote/email/checkout) so the amount the customer pays equals the proforma quote equals the server-recorded order.
- **Removes the "divergent duplicate money logic"** root cause behind the original flat-18% GST and discount bugs — future GST/coupon changes happen in one place.
- **Verified:** `npm test` 23/23 (incl. fractional-discount case) · `tsc` 0 · `next build` 33/33 · lint 0 errors · audit 0 vulns.

### Seventh pass (Phase 3: server-authoritative quote checkout — H7) — verified
- New pure `quoteTotals(quote)` in `lib/pricing.ts` computes a quote's amount from its **own stored items + locked `couponPercent`** (not client-posted prices).
- **`razorpay-order`** (the amount actually charged) now computes the quote amount server-side and ignores the client `amount` for quote checkouts (requires session + ownership). **Orders route** uses `quoteTotals` for the recorded total + reconciliation on quote-linked orders. Result: for the institutional/proforma flow, **amount charged = amount displayed = amount recorded**, and unit-price tampering is impossible.
- `proforma/[id]` GET and `proforma-email-helper` also routed through `quoteTotals` (further dedup). No feature flag needed — behavior-preserving for legitimate users (Phase 2 already made client/server pricing identical).
- **Still open (Phase 3b):** the **cart** path (individual purchases) still trusts client unit prices — closing it needs a server-side catalog price lookup by item id. Lower value, riskier; deferred.
- **Verified:** `npm test` 25/25 (+2 `quoteTotals`) · `tsc` 0 · `next build` 33/33 · lint 0 errors · audit 0 vulns.

### Eighth pass (Phase 4: N6 USD, gated) — verified
- Checkout is currency-aware end-to-end: the display symbol, the `razorpay-order` currency, and the recorded order currency all follow the linked quote (cart stays INR-only).
- USD online payment is gated behind **`ENABLE_USD_CHECKOUT`** (default off). Off → USD quote checkout is **blocked gracefully** ("contact us") instead of charging the USD figure as rupees (the N6 bug). On → charges USD (requires Razorpay international payments enabled on the account). Documented in `.env.example` (also added `RAZORPAY_WEBHOOK_SECRET`).
- **Verified:** `tsc` 0 · 25 tests · `build` 33/33 · lint 0 errors · audit 0 vulns.

### Ninth pass (Phase 5: admin authority re-derivation) — verified
- New `lib/auth/guards.ts`: **`requireAdmin()`** re-derives the admin role from the **database** on every request instead of trusting the role baked into the 7-day JWT. A demoted, deleted, or role-changed admin loses access **immediately** on their next request — closing the stale-token-role window.
- Applied uniformly to all **18** admin API handlers (15 route files), replacing the `getCurrentSession()` + `session.role !== "ADMIN"` pattern. Verified zero stale checks remain.
- 4 guard tests lock it (e.g., a JWT still claiming ADMIN is denied once the DB role is USER).
- **Deferred (noted in code):** `User.tokenVersion` for single-session/stolen-cookie revocation (needs auth-core plumbing + a migration); shorter JWT + refresh. The DB re-derivation already fixes the stated hole. Middleware (edge) keeps its JWT pre-check; the API routes are now the authoritative gate.
- **Verified:** `npm test` 29/29 · `tsc` 0 · `next build` 33/33 · lint 0 errors · audit 0 vulns.

### Tenth pass (Phase 3b: server-authoritative cart pricing) — verified
- New pure `makeCatalogPriceLookup(catalog)` (+ async `buildCatalogPriceLookup`) in `lib/journal-catalog.ts`: matches a cart item to the catalog by **ISSN** (then normalized name, stripping the cart's `(issue)` suffix) and coerces the catalog price (possibly a string like `"1,500"`) to a number.
- The orders route now **floors each cart item's price at the catalog price** — a tampered (under-priced) item is rejected. Crucially, **unmatched items or a catalog-load failure degrade to no validation**, so a legitimate order is never falsely rejected — hence no feature flag is needed.
- Completes H7: both the quote path (Phase 3) and the cart path (3b) are now protected against unit-price tampering.
- **Verified:** `npm test` 32/32 (+3 catalog-pricing) · `tsc` 0 · `next build` 33/33 · lint 0 errors · audit 0 vulns.

### Eleventh pass (Phase 6: low-risk polish) — verified
- **M6 cache invalidation** — admin journal save/delete now reset the in-memory catalog caches (`invalidateCatalogCache` + `invalidateChatbotCatalogCache`) in addition to `revalidatePath`, so the chatbot/catalog reflect edits immediately.
- **L4 accessibility** — login/register inputs now have associated labels (`htmlFor`/`id`) or `aria-label`; the product-detail plan cards are keyboard-operable (Enter/Space).
- **L5** — proforma subscription years now derive from the current year (default, add-config, and `<select>` options) instead of hardcoded 2024–2027.
- **Breadcrumb dead link** — added `app/product-category/journals/page.tsx` (redirects to `/catalogues-list`); build registers it (33 → 34 pages).
- **Admin loading/error states** — the admin dashboard load is wrapped in try/catch with a loading indicator + error message (no blank UI on a network failure).
- **Verified:** `npm test` 32/32 · `tsc` 0 · `next build` 34/34 · lint 0 errors · audit 0 vulns.

### Still open after eleventh pass
- **Mechanical:** apply `errorResponse()` to the admin-only routes (low risk).
- **Polish:** M6 catalog cache invalidation; L4 accessibility; L5 derive years from current year; breadcrumb dead links; admin loading/error states.
- **Larger (need migration / deploy coordination, designed for zero-downtime):** N1 persisted indexed PI number (additive nullable `@unique` column + lazy backfill), N2 Razorpay webhook + idempotency (ideally an additive unique constraint on `razorpayOrderId`), full pricing/GST centralization + IDs-only checkout + N6 USD (requires Razorpay international-payments capability on the account), re-derive admin authority per request (+ shorter JWT/refresh), and a Vitest/Jest suite.

## Appendix — build verification (2026-06-15)
Dependencies were installed and the full pipeline was run:
- `npm ci` → 502 packages installed.
- `npx prisma generate` → Prisma Client v6 generated.
- `npx tsc --noEmit` → **exit 0, no type errors.**
- `npm run build` (`next build`) → **exit 0**: `✓ Compiled successfully`, types valid, `✓ Generating static pages (33/33)`.

Two build-blockers were found and fixed during verification:
- **B1 — ESLint config newly surfaced 61 pre-existing errors** (`no-explicit-any`, `no-unescaped-entities`, `no-html-link-for-pages`, `prefer-const`) which `next build` treats as fatal. **[FIXED]** Resolved all 61 errors via the "safe cleanup": escaped JSX entities; converted internal page `<a>` → `<Link>` (10 instances); kept `<a>` with an inline `eslint-disable` for `/api/*` OAuth/logout routes (4 instances, where a full navigation is correct); `let`→`const`; and downgraded the stylistic `@typescript-eslint/no-explicit-any` to a **warning** (the code already passes `strict` tsc — proper typing of those `any`s is tracked as incremental follow-up). `npm run lint` now exits **0 (0 errors, 91 warnings)** and is a **blocking** CI step. `next build` keeps `eslint.ignoreDuringBuilds: true` purely to avoid double-linting (CI is the gate); `tsc` still enforces types at build time. Verified: lint 0 errors, `tsc` exit 0, `next build` 33/33 pages.
- **B2 — `razorpay-order/route.ts` instantiated `new Razorpay(...)` at module scope**, which throws (`key_id is mandatory`) on import when the env key is unset — crashing `next build` page-data collection and any cold start without the key. **[FIXED]** moved to a lazy `getRazorpay()` inside the handler (matching the orders route).

> Note: the build was run with placeholder `DATABASE_URL`/`JWT_SECRET` env values (no real DB is contacted — data pages are `force-dynamic`). Before deploying, run the same pipeline with real env vars configured.
