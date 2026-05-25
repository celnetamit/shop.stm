import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { extractLeadData, generateChatReply } from "@/lib/chatbot";

export const dynamic = "force-dynamic";

type Body = {
  message?: string;
  conversationId?: string;
  guestToken?: string;
};

function inferNameFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const local = (email.split("@")[0] || "").trim();
  if (!local) return null;
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const text = (body.message || "").trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
    }

    const session = await getCurrentSession();
    const lead = extractLeadData(text);

    let conversation = body.conversationId
      ? await prisma.chatConversation.findUnique({ where: { id: body.conversationId } })
      : null;

    if (!conversation) {
      if (session) {
        conversation = await prisma.chatConversation.findFirst({
          where: { userId: session.sub, status: "OPEN" },
          orderBy: { updatedAt: "desc" }
        });
      } else if (body.guestToken) {
        conversation = await prisma.chatConversation.findFirst({
          where: { guestToken: body.guestToken, status: "OPEN" },
          orderBy: { updatedAt: "desc" }
        });
      }
    }

    if (!conversation) {
      const inferredEmail = session?.email || lead.email || null;
      conversation = await prisma.chatConversation.create({
        data: {
          userId: session?.sub || null,
          guestToken: session ? null : body.guestToken || null,
          email: inferredEmail,
          name: lead.name || inferNameFromEmail(inferredEmail),
          phone: lead.phone || null,
          organization: lead.organization || null
        }
      });
    }

    const recent = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10
    });

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "USER",
        content: text
      }
    });

    const ai = await generateChatReply({
      userMessage: text,
      history: recent.map((m) => ({
        role: m.sender === "USER" ? "user" : "assistant",
        content: m.content
      }))
    });

    const botMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "BOT",
        content: JSON.stringify({ text: ai.reply, links: ai.links || [], steps: ai.steps || [] })
      }
    });

    const resolvedEmail = lead.email || session?.email || conversation.email || null;

    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        userId: session?.sub || conversation.userId || null,
        email: resolvedEmail,
        name: lead.name || conversation.name || inferNameFromEmail(resolvedEmail),
        phone: lead.phone || conversation.phone || null,
        organization: lead.organization || conversation.organization || null,
        intent: ai.intent || conversation.intent || null
      }
    });

    return NextResponse.json({
      ok: true,
      conversationId: conversation.id,
      reply: {
        id: botMessage.id,
        text: ai.reply,
        links: ai.links || [],
        steps: ai.steps || [],
        createdAt: botMessage.createdAt
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Chat failed." },
      { status: 500 }
    );
  }
}
