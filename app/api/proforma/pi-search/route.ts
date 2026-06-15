export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ ok: true, items: [] });

    // SECURITY: non-admins may only find PIs they own (created, or issued to their
    // email). This keeps the "find your existing PI" renewal flow working while
    // preventing harvesting of other institutions' contact/GST/address PII.
    // Admins retain a global lookup.
    const ownershipFilter =
      session.role === "ADMIN"
        ? undefined
        : { OR: [{ createdByUserId: session.sub }, { email: session.email }] };

    const matchFilter = {
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { organization: { contains: q, mode: "insensitive" as const } },
        { contactName: { contains: q, mode: "insensitive" as const } },
        { institutionName: { contains: q, mode: "insensitive" as const } }
      ]
    };

    const where = ownershipFilter ? { AND: [matchFilter, ownershipFilter] } : matchFilter;

    try {
      const items = await prisma.proformaQuote.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          piNumber: true,
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
      const basicMatch = {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { organization: { contains: q, mode: "insensitive" as const } },
          { contactName: { contains: q, mode: "insensitive" as const } }
        ]
      };
      const basicWhere = ownershipFilter ? { AND: [basicMatch, ownershipFilter] } : basicMatch;
      const basicItems = await prisma.proformaQuote.findMany({
        where: basicWhere,
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
    return errorResponse("proforma.pi-search.GET", error, "Search failed.");
  }
}
