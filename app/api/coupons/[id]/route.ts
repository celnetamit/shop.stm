export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-error";

function isAuthorized(role: string | undefined) {
  return role === "ADMIN";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || !isAuthorized(session.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return NextResponse.json({ ok: false, error: "Coupon not found" }, { status: 404 });
    }

    // Query actual payment orders where this string code was registered
    const usages = await prisma.order.findMany({
      where: { couponCode: coupon.code },
      select: {
        id: true,
        customerName: true,
        email: true,
        total: true,
        currency: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ ok: true, coupon, usages });
  } catch (error) {
    return errorResponse("coupons.[id].GET", error, "Failed to load coupon.");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || !isAuthorized(session.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as {
      code?: string;
      type?: "PERCENTAGE" | "FIXED";
      value?: number;
      discount?: number;
      maxUses?: number | string | null;
      minOrderAmount?: number;
      validFrom?: string | null;
      validUntil?: string | null;
      isActive?: boolean;
    };

    // N3: admins can now edit type/value/limits/validity, not just code/discount/isActive.
    const data: Record<string, unknown> = {};

    if (typeof body.code === "string") data.code = body.code.trim().toUpperCase();
    if (body.type === "PERCENTAGE" || body.type === "FIXED") data.type = body.type;

    if (body.value !== undefined) {
      const value = Number(body.value);
      if (!Number.isFinite(value) || value <= 0) {
        return NextResponse.json({ ok: false, error: "Discount value must be greater than 0." }, { status: 400 });
      }
      const effectiveType = (data.type as string | undefined) ?? body.type;
      if (effectiveType === "PERCENTAGE" && value > 100) {
        return NextResponse.json({ ok: false, error: "Percentage cannot exceed 100%." }, { status: 400 });
      }
      data.value = value;
      // Keep the legacy integer `discount` in sync for PERCENTAGE coupons.
      if (effectiveType !== "FIXED") data.discount = Math.round(value);
    }
    if (typeof body.discount === "number") data.discount = Math.max(0, Math.round(body.discount));

    if (body.maxUses !== undefined) {
      const raw = body.maxUses;
      data.maxUses = raw === null || raw === "" ? null : Math.max(1, Math.round(Number(raw)));
    }
    if (body.minOrderAmount !== undefined) data.minOrderAmount = Math.max(0, Number(body.minOrderAmount) || 0);
    if (body.validFrom !== undefined) data.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validUntil !== undefined) data.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const updated = await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ ok: true, coupon: updated });
  } catch (error) {
    return errorResponse("coupons.[id].PATCH", error, "Failed to update coupon.");
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
    return errorResponse("coupons.[id].DELETE", error, "Failed to delete coupon.");
  }
}
