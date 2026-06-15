export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
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
