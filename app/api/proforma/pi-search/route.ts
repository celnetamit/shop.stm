export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ ok: true, items: [] });

    try {
      const items = await prisma.proformaQuote.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { organization: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
            { institutionName: { contains: q, mode: "insensitive" } }
          ]
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          organization: true,
          institutionName: true,
          contactName: true,
          email: true,
          phone: true,
          country: true,
          address: true,
          gstNumber: true,
          subscriberCategory: true,
          designation: true
        }
      });
      const byEmail = new Map<string, (typeof items)[number]>();
      for (const it of items) {
        const key = (it.email || "").trim().toLowerCase();
        if (!key || byEmail.has(key)) continue;
        byEmail.set(key, it);
      }
      return NextResponse.json({ ok: true, items: Array.from(byEmail.values()) });
    } catch {
      // Fallback for DBs where new PI columns are not yet pushed.
      const basicItems = await prisma.proformaQuote.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { organization: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } }
          ]
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          organization: true,
          contactName: true,
          email: true,
          phone: true,
          country: true,
          address: true,
          gstNumber: true
        }
      });

      const normalized = basicItems.map((it) => ({
        ...it,
        institutionName: it.organization,
        subscriberCategory: null,
        designation: null
      }));

      const byEmail = new Map<string, (typeof normalized)[number]>();
      for (const it of normalized) {
        const key = (it.email || "").trim().toLowerCase();
        if (!key || byEmail.has(key)) continue;
        byEmail.set(key, it);
      }

      return NextResponse.json({
        ok: true,
        items: Array.from(byEmail.values())
      });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Search failed" }, { status: 500 });
  }
}
