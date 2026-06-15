export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-error";

function missingCouponTable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("does not exist") && msg.includes("coupon");
}

const fallbackCoupon = { id: "fallback-manish10", code: "MANISH10", discount: 10, isActive: true };

export async function GET() {
  try {
    const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    const hasFallback = rows.some((r: { code: string }) => r.code.toUpperCase() === "MANISH10");
    return NextResponse.json({ ok: true, coupons: hasFallback ? rows : [fallbackCoupon, ...rows] });
  } catch (error) {
    if (!missingCouponTable(error)) {
      return errorResponse("coupons.GET", error, "Failed to load coupons.");
    }
    return NextResponse.json({ ok: true, coupons: [fallbackCoupon], warning: "Coupon table missing" });
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      code?: string;
      type?: "PERCENTAGE" | "FIXED";
      value?: number;
      maxUses?: number | string | null;
      minOrderAmount?: number;
      validFrom?: string | null;
      validUntil?: string | null;
      isActive?: boolean;
    };

    const code = body.code?.trim().toUpperCase();
    if (!code) return NextResponse.json({ ok: false, error: "Coupon code is required" }, { status: 400 });

    const value = Number(body.value ?? 0);
    if (value <= 0) {
      return NextResponse.json({ ok: false, error: "Discount value must be greater than 0." }, { status: 400 });
    }

    const type = body.type === "FIXED" ? "FIXED" : "PERCENTAGE";
    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json({ ok: false, error: "Percentage cannot exceed 100%." }, { status: 400 });
    }

    // Explicitly parse input strings to dynamic optional integers/nulls
    const maxUsesRaw = body.maxUses;
    const maxUses = (maxUsesRaw === null || maxUsesRaw === undefined || maxUsesRaw === "") ? null : Math.max(1, Math.round(Number(maxUsesRaw)));
    
    const minOrderAmount = Math.max(0, Number(body.minOrderAmount ?? 0));

    const validFrom = body.validFrom ? new Date(body.validFrom) : null;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;

    // Fallback tracking integer for pre-existing components
    const computedDiscountInt = type === "PERCENTAGE" ? Math.round(value) : 0;

    const created = await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        discount: computedDiscountInt,
        maxUses,
        minOrderAmount,
        validFrom,
        validUntil,
        isActive: body.isActive ?? true
      }
    });

    return NextResponse.json({ ok: true, coupon: created });
  } catch (error) {
    if (missingCouponTable(error)) {
      return NextResponse.json({ ok: false, error: "Coupon table missing. Run prisma db push." }, { status: 500 });
    }
    return errorResponse("coupons.POST", error, "Failed to save coupon.");
  }
}
