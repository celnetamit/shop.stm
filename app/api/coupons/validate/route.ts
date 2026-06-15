export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-error";

function missingCouponTable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("does not exist") && msg.includes("coupon");
}

export async function GET(req: NextRequest) {
  const codeInput = req.nextUrl.searchParams.get("code") || "";
  const subtotalParam = Number(req.nextUrl.searchParams.get("subtotal") || 0);
  
  const code = codeInput.trim().toUpperCase();
  if (!code) return NextResponse.json({ ok: false, error: "Coupon code required" }, { status: 400 });

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ ok: false, error: "Invalid or inactive coupon" }, { status: 404 });
    }

    // 1. Timeframe Validation
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({ ok: false, error: "Coupon is not yet active." }, { status: 400 });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({ ok: false, error: "Coupon has expired." }, { status: 400 });
    }

    // 2. Usage Limit Validation
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ ok: false, error: "Coupon usage limit has been reached." }, { status: 400 });
    }

    // 3. Minimum Order Validation
    if (subtotalParam < coupon.minOrderAmount) {
      const diff = Math.max(0, coupon.minOrderAmount - subtotalParam);
      return NextResponse.json({
        ok: false,
        error: `Add ₹${diff.toLocaleString("en-IN")} more to use this coupon.`,
        minOrderAmount: coupon.minOrderAmount,
        diff: diff
      }, { status: 400 });
    }

    // Standard fallback parsing for legacy system usage
    const computedDiscountInt = coupon.type === "PERCENTAGE" ? Math.round(coupon.value) : 0;

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: computedDiscountInt // Retain legacy integer binding
      }
    });
  } catch (error) {
    if (missingCouponTable(error)) {
      return NextResponse.json({ ok: false, error: "Coupon table missing" }, { status: 500 });
    }
    return errorResponse("coupons.validate.GET", error, "Failed to validate coupon.");
  }
}
