export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

function missingCouponTable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("does not exist") && msg.includes("coupon");
}

const fallbackCoupon = { id: "fallback-manish10", code: "MANISH10", discount: 10, isActive: true, createdAt: new Date().toISOString() };

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, coupons });
  } catch (error) {
    if (missingCouponTable(error)) return NextResponse.json({ ok: true, coupons: [fallbackCoupon], warning: "Coupon table missing" });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
