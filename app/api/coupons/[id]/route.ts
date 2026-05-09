import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

function isAuthorized(role: string | undefined) {
  return role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || !isAuthorized(session.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as { code?: string; discount?: number; isActive?: boolean };
    const data: { code?: string; discount?: number; isActive?: boolean } = {};

    if (typeof body.code === "string") data.code = body.code.trim().toUpperCase();
    if (typeof body.discount === "number") data.discount = body.discount;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const updated = await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ ok: true, coupon: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || !isAuthorized(session.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
