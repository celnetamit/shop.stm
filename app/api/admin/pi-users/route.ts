export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const proformas = await prisma.proformaQuote.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 1000
  });

  const byEmail = new Map<string, any>();
  for (const q of proformas) {
    const key = q.email.toLowerCase();
    if (!byEmail.has(key)) {
      byEmail.set(key, {
        email: q.email,
        name: q.contactName,
        collegeName: q.institutionName || q.organization,
        latestAt: q.createdAt,
        entries: []
      });
    }
    const row = byEmail.get(key);
    if (q.createdAt > row.latestAt) {
      row.latestAt = q.createdAt;
      row.name = q.contactName;
      row.collegeName = q.institutionName || q.organization;
    }
    row.entries.push({
      id: q.id,
      piNumber: q.piNumber,
      createdAt: q.createdAt,
      status: q.status,
      subscriberCategory: q.subscriberCategory,
      couponCode: q.couponCode,
      couponPercent: q.couponPercent,
      items: q.items.map((it) => ({
        id: it.id,
        journalName: it.journalName,
        selectedPlan: it.selectedPlan,
        unitPrice: it.unitPrice
      }))
    });
  }

  const users = Array.from(byEmail.values()).sort((a, b) => +new Date(b.latestAt) - +new Date(a.latestAt));
  return NextResponse.json({ ok: true, users });
}
