import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 40
      }
    }
  });

  return NextResponse.json({ ok: true, rows });
}
