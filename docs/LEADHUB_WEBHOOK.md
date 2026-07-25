# LeadHub Lead Webhook

Every lead captured on the site is POSTed server-side to the central CRM
(LeadHub) at `https://leads.celnet.in/webhook/lead`. All the logic lives in
[lib/leadhub.ts](../lib/leadhub.ts); route handlers only call `captureLead()`.

## Configuration

Server-side env vars only — never expose these to the browser.

| Var | Required | Notes |
|---|---|---|
| `LEADHUB_WEBHOOK_SECRET` | yes | HMAC-SHA256 shared secret. **Empty disables all outbound posting**, so local/preview never talks to the CRM. |
| `LEADHUB_WEBHOOK_URL` | no | Defaults to `https://leads.celnet.in/webhook/lead`. |
| `LEADHUB_SOURCE` | no | Defaults to `shop.stmjournals.in`. This is the only value that changes when the integration is reused for `products.reinste.com` / `products.nanoschool.in`. |
| `LEADHUB_WEBHOOK_TOKEN` | no | Only if LeadHub authenticates this deployment with a plain `X-Webhook-Secret` token instead of the HMAC signature. Both headers are sent when both are set. |
| `CRON_SECRET` | yes | Authorizes the retry endpoint (below). |

## Events

| Fires from | `event_type` | `external_id` |
|---|---|---|
| `POST /api/proforma` (subscriber details saved) | `proforma_request` | `PF-<quoteId>` |
| `PATCH /api/proforma/[id]/subscriber` (details edited) | `proforma_request` | `PF-<quoteId>` |
| `PATCH /api/proforma/[id]` (journals submitted) | `proforma_request` | `PF-<quoteId>` |
| `POST /api/contact-entries` ("Any Queries?" / contact form) | `contact_enquiry` | `CE-<entryId>` |
| `POST /api/agency-query` (subscription-agency enquiry) | `contact_enquiry` | `CE-<queryId>` |
| `POST /api/auth/register` | `subscriber_signup` | `SU-<userId>` |
| `GET /api/auth/google/callback` (first-time sign-in only) | `subscriber_signup` | `SU-<userId>` |

The three proforma hooks deliberately share one `external_id` per quote. The
first fires as soon as we have a contact, before any journal is chosen; the
submit hook re-sends the same id with `journals`, `currency` and
`value_estimate` (from `computeTotals`, so the CRM figure matches the PI). Since
LeadHub de-duplicates on (`source` + `external_id`), those re-sends **update**
one lead rather than creating three.

`external_id`s are namespaced by event type so ids can never collide across
tables, and they are the record's own cuid — stable across retries and edits.

## Reliability

`captureLead()` is fire-and-forget: it is called only after the record is
committed, never blocks the response, and never throws into a route handler.

Each payload is journalled to the `LeadWebhookDelivery` outbox *before* the
first send attempt, so a lead is never lost when the CRM is down. Failures are
classified: `5xx` and network errors are retryable, `401`/`422` are not (they
are our bug, and retrying cannot fix them). Retryable failures stay `PENDING`
with a `nextAttemptAt` on a 30s → 2m → 10m → 30m → 2h backoff, 6 attempts
total, after which the row goes `FAILED` and needs a human.

If the outbox table is missing or the DB is unreachable, the send is still
attempted — degraded, not broken.

### Retries

Nothing retries on its own; point a cron at the flush endpoint:

```cron
*/5 * * * * curl -fsS -X POST https://shop.stmjournals.in/api/webhooks/leadhub/flush -H "x-cron-secret: $CRON_SECRET"
```

`GET` the same URL for queue health (counts by status, last 20 deliveries with
their `remoteLeadId` and errors). Both verbs also accept an ADMIN/MANAGER
session for manual pokes from a browser.

## Setup on a new environment

```bash
npx prisma generate
npx prisma db push          # creates LeadWebhookDelivery
```

Then set `LEADHUB_WEBHOOK_SECRET` (test secret first) and send a signed probe:

```bash
npx tsx scripts/leadhub-test.ts                        # contact_enquiry, TEST-0001
npx tsx scripts/leadhub-test.ts proforma_request TEST-0002
```

Report the `external_id`s used to the LeadHub team so they can confirm they
landed and clean them up. A repeated `external_id` coming back as
`duplicate` is idempotency working, not an error.

## Signing

HMAC-SHA256 over the **exact raw body bytes**, hex-encoded, in
`X-Leadhub-Signature`. `postLead()` serializes the payload once and signs and
sends that same string — do not re-serialize between signing and sending.
`verifyLeadSignature()` does the constant-time inverse if we ever need to
verify our own header.
