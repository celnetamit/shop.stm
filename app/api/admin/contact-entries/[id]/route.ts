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
    const body = (await req.json()) as { status?: "NEW" | "IN_PROGRESS" | "RESOLVED" };
    if (!body.status) {
      return NextResponse.json({ ok: false, error: "Status is required" }, { status: 400 });
    }
    const entry = await prisma.contactEntry.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
