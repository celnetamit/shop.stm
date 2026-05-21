export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });

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

  return NextResponse.json({ ok: true, items });
}

