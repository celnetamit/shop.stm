export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const entry = await prisma.contactEntry.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        subject: body.subject.trim(),
        message: body.message.trim()
      }
    });

    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const d = { name: entry.name, email: entry.email, subject: entry.subject, message: entry.message };
      await sendTemplatedEmail("CONTACT_RECEIVED", entry.email, d);
      await sendAdminNotification("CONTACT_RECEIVED_ADMIN", d);
    } catch (e) {
      console.error("Contact Notification Error", e);
    }

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to save contact entry" },
      { status: 500 }
    );
  }
}
