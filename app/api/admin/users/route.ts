export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
