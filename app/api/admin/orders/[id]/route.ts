export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: "PENDING" | "PAID" | "CANCELLED"; adminRemarks?: string };

    const validStatuses = ["PENDING", "PAID", "CANCELLED"] as const;
    if (body.status !== undefined && !validStatuses.includes(body.status)) {
      return NextResponse.json({ ok: false, error: "Invalid status value" }, { status: 400 });
    }
    
    const data: { status?: "PENDING" | "PAID" | "CANCELLED"; adminRemarks?: string } = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.adminRemarks !== undefined) data.adminRemarks = body.adminRemarks;

    const order = await prisma.order.update({ where: { id }, data });
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
