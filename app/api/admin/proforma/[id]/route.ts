export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: "DRAFT" | "SUBMITTED" | "PAID"; adminRemarks?: string };
    
    const data: any = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.adminRemarks !== undefined) data.adminRemarks = body.adminRemarks;

    const quote = await prisma.proformaQuote.update({ where: { id }, data });
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
