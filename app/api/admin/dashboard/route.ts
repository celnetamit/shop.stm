import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [orders, proformas, contactEntries, users, coupons] = await Promise.allSettled([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.proformaQuote.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.contactEntry.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  ]);

  return NextResponse.json({
    ok: true,
    orders: orders.status === "fulfilled" ? orders.value : [],
    proformas: proformas.status === "fulfilled" ? proformas.value : [],
    contactEntries: contactEntries.status === "fulfilled" ? contactEntries.value : [],
    users: users.status === "fulfilled" ? users.value : [],
    coupons: coupons.status === "fulfilled" ? coupons.value : []
  });
}
