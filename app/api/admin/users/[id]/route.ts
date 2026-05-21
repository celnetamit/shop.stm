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
    const body = (await req.json()) as { role?: "USER" | "ADMIN" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR" };
    const allowedRoles = new Set(["USER", "ADMIN", "LIBRARIAN", "AGENCY", "STUDENT", "SCHOLAR"]);
    if (!body.role || !allowedRoles.has(body.role)) {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id }, data: { role: body.role } });
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Prevent self-deletion
    if (id === session.sub) {
      return NextResponse.json({ ok: false, error: "Cannot delete your own administrator account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Deletion Failed" }, { status: 500 });
  }
}
