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
    const body = (await req.json()) as { role?: "USER" | "ADMIN" };
    if (!body.role || (body.role !== "USER" && body.role !== "ADMIN")) {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id }, data: { role: body.role } });
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
