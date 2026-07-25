// LeadHub CRM lead webhook client.
//
// Every lead captured on the site is POSTed to the central CRM (LeadHub) as a
// flat JSON payload. Rules that the integration brief pins down and that this
// module is the single owner of:
//
//   * Fire server-side only, AFTER the record is committed to our DB.
//   * Auth is an HMAC-SHA256 of the EXACT raw body bytes, hex-encoded, in
//     `X-Leadhub-Signature`. The body is serialized once and that same string
//     is both signed and sent.
//   * `external_id` is stable and unique per lead, so LeadHub de-duplicates on
//     (source + external_id) and retries/edits update instead of duplicating.
//   * A failed webhook must never fail or delay the user's request. Deliveries
//     are journalled in an outbox table and retried with backoff by
//     /api/webhooks/leadhub/flush.
//
// Configure with LEADHUB_WEBHOOK_URL + LEADHUB_WEBHOOK_SECRET (server-side env
// vars only). With no secret configured the module stays inert, so local and
// preview environments never post to the CRM.

import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

export type LeadEventType = "proforma_request" | "contact_enquiry" | "subscriber_signup";

export interface LeadJournal {
  title: string;
  issn?: string;
  qty?: number;
}

/** The wire payload, exactly as documented in the integration brief. */
export interface LeadPayload {
  source: string;
  event_type: LeadEventType;
  external_id: string;
  created_at: string;
  name: string;
  email: string;
  phone?: string;
  institution?: string;
  country?: string;
  designation?: string;
  message?: string;
  journals?: LeadJournal[];
  currency?: string;
  value_estimate?: number;
  source_url?: string;
}

/** What callers hand us; loose types because it comes straight off DB rows. */
export interface LeadInput {
  eventType: LeadEventType;
  /** Our record id. Prefixed per event type by `buildExternalId`. */
  externalId: string;
  createdAt?: Date | string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  institution?: string | null;
  country?: string | null;
  designation?: string | null;
  message?: string | null;
  journals?: Array<{ title?: string | null; issn?: string | null; qty?: number | null }> | null;
  currency?: string | null;
  valueEstimate?: number | null;
  sourceUrl?: string | null;
}

const DEFAULT_WEBHOOK_URL = "https://leads.celnet.in/webhook/lead";
const DEFAULT_SOURCE = "shop.stmjournals.in";
const REQUEST_TIMEOUT_MS = 10_000;

/** Backoff schedule in ms, indexed by attempts already made. */
const RETRY_BACKOFF_MS = [30_000, 120_000, 600_000, 1_800_000, 7_200_000];
export const MAX_LEAD_ATTEMPTS = RETRY_BACKOFF_MS.length + 1;

export interface LeadhubConfig {
  url: string;
  secret: string;
  source: string;
  /** Optional plain-token header, for the pre-HMAC flavour of the endpoint. */
  legacySecret: string;
  enabled: boolean;
}

export function getLeadhubConfig(): LeadhubConfig {
  const secret = process.env.LEADHUB_WEBHOOK_SECRET?.trim() || "";
  const legacySecret = process.env.LEADHUB_WEBHOOK_TOKEN?.trim() || "";
  return {
    url: process.env.LEADHUB_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK_URL,
    secret,
    source: process.env.LEADHUB_SOURCE?.trim() || DEFAULT_SOURCE,
    legacySecret,
    enabled: Boolean(secret || legacySecret)
  };
}

/**
 * Namespaced record id. Keeps ids unique across tables (a ProformaQuote cuid
 * and a ContactEntry cuid could otherwise collide in theory) and makes the id
 * readable in the CRM.
 */
export function buildExternalId(eventType: LeadEventType, recordId: string): string {
  const prefix = eventType === "proforma_request" ? "PF" : eventType === "contact_enquiry" ? "CE" : "SU";
  return `${prefix}-${recordId}`;
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : undefined;
}

function toIsoUtc(value: Date | string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  // YYYY-MM-DDTHH:MM:SSZ — second precision, UTC, per the brief.
  return `${safe.toISOString().slice(0, 19)}Z`;
}

/** Strip the origin's path noise but keep an absolute URL if we got one. */
function normalizeSourceUrl(value: string | null | undefined): string | undefined {
  const raw = clean(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

/**
 * Best-effort capture page URL: the form's own page is the referer of the API
 * call. Falls back to the configured app origin + `fallbackPath`.
 */
export function leadSourceUrl(headers: Headers, fallbackPath?: string): string | undefined {
  const referer = normalizeSourceUrl(headers.get("referer"));
  if (referer) return referer;
  if (!fallbackPath) return undefined;
  const base = (process.env.NEXT_PUBLIC_APP_URL || `https://${DEFAULT_SOURCE}`).replace(/\/$/, "");
  return normalizeSourceUrl(`${base}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`);
}

/**
 * Builds the flat payload, dropping every optional field we have no value for
 * (the brief asks for omission rather than nulls).
 */
export function buildLeadPayload(input: LeadInput, config: LeadhubConfig = getLeadhubConfig()): LeadPayload {
  const journals = (input.journals || [])
    .map((item) => {
      const title = clean(item?.title);
      if (!title) return null;
      const issn = clean(item?.issn);
      const qty = Number(item?.qty);
      const journal: LeadJournal = { title };
      if (issn) journal.issn = issn;
      journal.qty = Number.isFinite(qty) && qty > 0 ? Math.round(qty) : 1;
      return journal;
    })
    .filter((item): item is LeadJournal => item !== null);

  const payload: LeadPayload = {
    source: config.source,
    event_type: input.eventType,
    external_id: input.externalId,
    created_at: toIsoUtc(input.createdAt),
    name: clean(input.name) || "Unknown",
    email: clean(input.email)?.toLowerCase() || ""
  };

  const phone = clean(input.phone);
  if (phone) payload.phone = phone;

  const institution = clean(input.institution);
  if (institution) payload.institution = institution;

  const country = clean(input.country);
  if (country) payload.country = country;

  const designation = clean(input.designation);
  if (designation) payload.designation = designation;

  const message = clean(input.message);
  if (message) payload.message = message;

  if (journals.length) payload.journals = journals;

  const currency = clean(input.currency)?.toUpperCase();
  if (currency) payload.currency = currency;

  const valueEstimate = Number(input.valueEstimate);
  if (Number.isFinite(valueEstimate) && valueEstimate > 0) {
    payload.value_estimate = Math.round(valueEstimate * 100) / 100;
  }

  const sourceUrl = normalizeSourceUrl(input.sourceUrl);
  if (sourceUrl) payload.source_url = sourceUrl;

  return payload;
}

/** Hex HMAC-SHA256 over the exact body string that will be transmitted. */
export function signLeadBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

/** Constant-time signature comparison, for anything verifying our own header. */
export function verifyLeadSignature(body: string, signature: string, secret: string): boolean {
  const expected = signLeadBody(body, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface LeadPostResult {
  ok: boolean;
  status: number;
  /** True for network errors and 5xx — the brief tells us to retry those. */
  retryable: boolean;
  remoteLeadId?: string;
  error?: string;
}

/**
 * One delivery attempt. Serializes once, signs that string, sends that string.
 * Never throws.
 */
export async function postLead(
  payload: LeadPayload,
  config: LeadhubConfig = getLeadhubConfig()
): Promise<LeadPostResult> {
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.secret) headers["X-Leadhub-Signature"] = signLeadBody(body, config.secret);
  // Some deployments of the endpoint still authenticate with a plain token.
  if (config.legacySecret) headers["X-Webhook-Secret"] = config.legacySecret;

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      // Non-JSON body; the status code is still authoritative.
    }

    const remoteLeadId =
      typeof parsed.lead_id === "string" ? parsed.lead_id : typeof parsed.id === "string" ? parsed.id : undefined;

    if (res.ok) {
      return { ok: true, status: res.status, retryable: false, remoteLeadId };
    }

    return {
      ok: false,
      status: res.status,
      // 401/422 are our bug, not a blip — retrying cannot fix them.
      retryable: res.status >= 500,
      error: text.slice(0, 1000) || `HTTP ${res.status}`
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      retryable: true,
      error: error instanceof Error ? error.message : "network error"
    };
  }
}

function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    (msg.includes("does not exist") && msg.includes("leadwebhookdelivery")) ||
    msg.includes("can't reach database server") ||
    msg.includes("prismaclientinitializationerror") ||
    msg.includes("connection refused")
  );
}

function nextAttemptDelayMs(attempts: number): number | null {
  if (attempts >= MAX_LEAD_ATTEMPTS) return null;
  return RETRY_BACKOFF_MS[Math.min(attempts - 1, RETRY_BACKOFF_MS.length - 1)];
}

/**
 * Journals the payload in the outbox before we try to send it, so a lead is
 * never lost when the CRM (or this process) is down. Returns the row id, or
 * null when the outbox itself is unavailable.
 */
async function recordPending(payload: LeadPayload): Promise<string | null> {
  try {
    const row = await prisma.leadWebhookDelivery.upsert({
      where: {
        source_externalId_eventType: {
          source: payload.source,
          externalId: payload.external_id,
          eventType: payload.event_type
        }
      },
      create: {
        source: payload.source,
        eventType: payload.event_type,
        externalId: payload.external_id,
        payload: payload as unknown as object,
        status: "PENDING",
        attempts: 0
      },
      update: {
        // Re-sends (edits, enrichment) replace the payload and re-open the row.
        payload: payload as unknown as object,
        status: "PENDING",
        nextAttemptAt: null,
        lastError: null
      },
      select: { id: true }
    });
    return row.id;
  } catch (error) {
    if (!isMissingTableError(error)) console.error("[leadhub] outbox write failed", error);
    return null;
  }
}

async function recordResult(rowId: string | null, attempts: number, result: LeadPostResult): Promise<void> {
  if (!rowId) return;

  const delayMs = result.retryable ? nextAttemptDelayMs(attempts) : null;
  const status = result.ok ? "SENT" : delayMs === null ? "FAILED" : "PENDING";

  try {
    await prisma.leadWebhookDelivery.update({
      where: { id: rowId },
      data: {
        status,
        attempts,
        lastStatusCode: result.status || null,
        lastError: result.ok ? null : result.error?.slice(0, 1000) || null,
        remoteLeadId: result.remoteLeadId || null,
        deliveredAt: result.ok ? new Date() : null,
        nextAttemptAt: delayMs === null ? null : new Date(Date.now() + delayMs)
      }
    });
  } catch (error) {
    if (!isMissingTableError(error)) console.error("[leadhub] outbox update failed", error);
  }
}

/**
 * Journal + one immediate delivery attempt. Failures are left in the outbox for
 * the flush endpoint. Never throws.
 */
export async function deliverLead(input: LeadInput): Promise<LeadPostResult | null> {
  const config = getLeadhubConfig();
  const payload = buildLeadPayload(input, config);

  if (!payload.email) {
    console.warn(`[leadhub] skipping ${payload.event_type} ${payload.external_id}: no email`);
    return null;
  }

  if (!config.enabled) {
    // Not configured (local/preview): stay silent rather than logging per lead.
    return null;
  }

  const rowId = await recordPending(payload);
  const result = await postLead(payload, config);
  await recordResult(rowId, 1, result);

  if (!result.ok) {
    console.error(
      `[leadhub] ${payload.event_type} ${payload.external_id} failed (status ${result.status}): ${result.error}`
    );
  }

  return result;
}

/**
 * Fire-and-forget entry point for route handlers. Call it after the record is
 * committed; it never blocks the response and never throws.
 */
export function captureLead(input: LeadInput): void {
  const run = () =>
    deliverLead(input).catch((error) => {
      console.error("[leadhub] capture failed", error);
    });

  void run();
}

export interface FlushSummary {
  processed: number;
  sent: number;
  retrying: number;
  failed: number;
  skipped: boolean;
  /** Why nothing was attempted — the two cases need different fixes. */
  skippedReason?: "not_configured" | "outbox_unavailable";
}

/**
 * Retries every due outbox row. Meant to be poked periodically (cron) — see
 * /api/webhooks/leadhub/flush.
 */
export async function flushLeadQueue(limit = 50): Promise<FlushSummary> {
  const summary: FlushSummary = { processed: 0, sent: 0, retrying: 0, failed: 0, skipped: false };

  const config = getLeadhubConfig();
  if (!config.enabled) {
    summary.skipped = true;
    summary.skippedReason = "not_configured";
    return summary;
  }

  let due: Array<{ id: string; attempts: number; payload: unknown }> = [];
  try {
    due = await prisma.leadWebhookDelivery.findMany({
      where: {
        status: "PENDING",
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }]
      },
      orderBy: { createdAt: "asc" },
      take: Math.max(1, Math.min(200, limit)),
      select: { id: true, attempts: true, payload: true }
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    summary.skipped = true;
    summary.skippedReason = "outbox_unavailable";
    return summary;
  }

  for (const row of due) {
    const payload = row.payload as LeadPayload | null;
    if (!payload || typeof payload !== "object" || !payload.external_id) {
      await recordResult(row.id, MAX_LEAD_ATTEMPTS, {
        ok: false,
        status: 0,
        retryable: false,
        error: "malformed stored payload"
      });
      summary.processed += 1;
      summary.failed += 1;
      continue;
    }

    const attempts = row.attempts + 1;
    const result = await postLead(payload, config);
    await recordResult(row.id, attempts, result);

    summary.processed += 1;
    if (result.ok) summary.sent += 1;
    else if (result.retryable && nextAttemptDelayMs(attempts) !== null) summary.retrying += 1;
    else summary.failed += 1;
  }

  return summary;
}
