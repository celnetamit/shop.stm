import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function missingCouponTable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("does not exist") && msg.includes("coupon");
}

export async function GET(req: NextRequest) {
  const codeInput = req.nextUrl.searchParams.get("code") || "";
  const code = codeInput.trim().toUpperCase();
  if (!code) return NextResponse.json({ ok: false, error: "Coupon code required" }, { status: 400 });

  if (code === "MANISH10") {
    return NextResponse.json({ ok: true, coupon: { code: "MANISH10", discount: 10 } });
  }

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ ok: false, error: "Invalid or inactive coupon" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, coupon: { code: coupon.code, discount: coupon.discount } });
  } catch (error) {
    if (missingCouponTable(error)) {
      return NextResponse.json({ ok: false, error: "Coupon table missing" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
