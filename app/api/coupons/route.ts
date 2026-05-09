export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

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
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
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
    const body = (await req.json()) as { code?: string; discount?: number; isActive?: boolean };
    const code = body.code?.trim().toUpperCase();
    const discount = Number(body.discount ?? 0);

    if (!code) return NextResponse.json({ ok: false, error: "Coupon code is required" }, { status: 400 });
    if (!Number.isInteger(discount) || discount <= 0 || discount > 100) {
      return NextResponse.json({ ok: false, error: "Discount must be an integer between 1 and 100" }, { status: 400 });
    }

    const created = await prisma.coupon.create({
      data: {
        code,
        discount,
        isActive: body.isActive ?? true
      }
    });

    return NextResponse.json({ ok: true, coupon: created });
  } catch (error) {
    if (missingCouponTable(error)) {
      return NextResponse.json({ ok: false, error: "Coupon table missing. Run prisma db push." }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
