export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

function isMissingOrderTable(error: unknown) {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return m.includes("order") && m.includes("does not exist");
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({ include: { user: true, items: true }, orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    if (isMissingOrderTable(error)) return NextResponse.json({ ok: true, orders: [], warning: "Order table missing. Run prisma db push." });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
