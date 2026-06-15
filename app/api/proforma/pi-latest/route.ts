export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

    const latest = await prisma.proformaQuote.findFirst({
      where: {
        OR: [
          { createdByUserId: session.sub },
          { email: session.email }
        ]
      },
      orderBy: { updatedAt: "desc" },
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

    return NextResponse.json({ ok: true, profile: latest || null });
  } catch (error) {
    return errorResponse("proforma.pi-latest.GET", error, "Failed to load your latest PI.");
  }
}
