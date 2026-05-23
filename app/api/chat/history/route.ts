import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: true, conversation: null });
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: { userId: session.sub },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 80
      }
    }
  });

  return NextResponse.json({ ok: true, conversation });
}
