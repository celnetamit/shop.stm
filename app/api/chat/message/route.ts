import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { extractLeadData, generateChatReply } from "@/lib/chatbot";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 2000;

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
    // Throttle the unauthenticated, paid-LLM-backed endpoint: 20 messages / minute per IP.
    const ip = clientIpFrom(req);
    const limit = rateLimit(`chat:${ip}`, 20, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, error: "You're sending messages too quickly. Please slow down." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = (await req.json()) as Body;
    const text = (body.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
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
    console.error("Chat failed:", error);
    return NextResponse.json(
      { ok: false, error: "Chat is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
