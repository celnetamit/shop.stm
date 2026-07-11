import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buildProformaPdfAttachment } from "@/lib/email-attachments";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || id.startsWith("draft-")) {
    return NextResponse.json({ ok: false, error: "Invalid proforma id." }, { status: 400 });
  }

  const quote = await prisma.proformaQuote.findUnique({ where: { id }, select: { createdByUserId: true, email: true } });
  if (!quote) {
    return NextResponse.json({ ok: false, error: "Proforma not found." }, { status: 404 });
  }
  if (session.role !== "ADMIN" && quote.createdByUserId !== session.sub && quote.email.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }

  const attachment = await buildProformaPdfAttachment(id);
  if (!attachment) {
    return NextResponse.json({ ok: false, error: "Proforma not found." }, { status: 404 });
  }

  return new NextResponse(attachment.data, {
    status: 200,
    headers: {
      "content-type": attachment.contentType,
      "content-disposition": `inline; filename="${attachment.filename}"`
    }
  });
}
