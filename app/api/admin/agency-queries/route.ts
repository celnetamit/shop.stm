export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agencyQueries = await prisma.agencyQuery.findMany({
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return NextResponse.json({ ok: true, queries: agencyQueries });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Failed to load agency queries" 
    }, { status: 500 });
  }
}
