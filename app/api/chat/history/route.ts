import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return NextResponse.json({ ok: false, conversation: null, error: "Failed to load chat history." }, { status: 500 });
  }
}
