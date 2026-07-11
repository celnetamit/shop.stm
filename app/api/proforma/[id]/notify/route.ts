import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function proformaPdfFilename(piNumber: string) {
  return `proforma-${piNumber.replace(/[^\w.-]+/g, "_")}.pdf`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await req.json().catch(() => ({}));
    const { id } = await params;
    if (!id || id.startsWith("draft-")) {
      return NextResponse.json({ ok: false, error: "Cannot notify on a draft quote." }, { status: 400 });
    }

    const quote = await prisma.proformaQuote.findUnique({ where: { id }, select: { createdByUserId: true } });
    if (!quote) {
      return NextResponse.json({ ok: false, error: "Quote failed refinement." }, { status: 404 });
    }
    if (session.role !== "ADMIN" && quote.createdByUserId !== session.sub) {
      return NextResponse.json({ ok: false, error: "Unauthorized: you do not own this quote." }, { status: 403 });
    }

    const { prepareProformaEmailPayload } = await import("@/lib/proforma-email-helper");
    const d = await prepareProformaEmailPayload(id);

    if (!d) {
      return NextResponse.json({ ok: false, error: "Quote failed refinement." }, { status: 404 });
    }

    const { buildProformaPdfAttachment } = await import("@/lib/email-attachments");
    const attachment = await buildProformaPdfAttachment(id);
    if (!attachment) {
      return NextResponse.json({ ok: false, error: "Generated proforma PDF attachment is required." }, { status: 400 });
    }

    const attachmentsJson = JSON.stringify([
      { filename: attachment.filename || proformaPdfFilename(d.quoteId), contentType: attachment.contentType, base64: attachment.data.toString("base64") }
    ]);

    const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
    await sendTemplatedEmail("PROFORMA_CREATED", d.email, { ...d, __attachments: attachmentsJson });
    await sendAdminNotification("PROFORMA_CREATED_ADMIN", { ...d, __attachments: attachmentsJson });

    return NextResponse.json({ ok: true, message: "Notifications dispatched successfully." });
  } catch (err) {
    console.error("Manual notify error", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
