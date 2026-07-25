export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { flushLeadQueue, getLeadhubConfig, MAX_LEAD_ATTEMPTS } from "@/lib/leadhub";

/**
 * Drains the LeadHub outbox (see lib/leadhub.ts). Point a cron at it:
 *
 *   *\/5 * * * * curl -fsS -X POST https://shop.stmjournals.in/api/webhooks/leadhub/flush \
 *                  -H "x-cron-secret: $CRON_SECRET"
 *
 * Authorized by CRON_SECRET, or by an ADMIN/MANAGER session for manual pokes.
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const header = req.headers.get("x-cron-secret")?.trim();
    const bearer = req.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
    if (header === cronSecret || bearer === cronSecret) return true;
  }

  const session = await getCurrentSession();
  return session?.role === "ADMIN" || session?.role === "MANAGER";
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

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;

  try {
    const summary = await flushLeadQueue(limit);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Flush failed" },
      { status: 500 }
    );
  }
}

/** Queue health, for the admin UI and for confirming test leads landed. */
export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const config = getLeadhubConfig();

  try {
    const [grouped, recent] = await Promise.all([
      prisma.leadWebhookDelivery.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.leadWebhookDelivery.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          externalId: true,
          eventType: true,
          status: true,
          attempts: true,
          lastStatusCode: true,
          lastError: true,
          remoteLeadId: true,
          nextAttemptAt: true,
          deliveredAt: true,
          createdAt: true
        }
      })
    ]);

    return NextResponse.json({
      ok: true,
      configured: config.enabled,
      endpoint: config.url,
      source: config.source,
      maxAttempts: MAX_LEAD_ATTEMPTS,
      counts: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
      recent
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        ok: true,
        configured: config.enabled,
        endpoint: config.url,
        source: config.source,
        warning: "LeadWebhookDelivery table missing — run prisma db push",
        counts: {},
        recent: []
      });
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to read queue" },
      { status: 500 }
    );
  }
}
