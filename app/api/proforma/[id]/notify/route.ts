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
    const payload = (await req.json().catch(() => ({}))) as { attachmentBase64?: string };
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

    if (!payload.attachmentBase64) {
      return NextResponse.json({ ok: false, error: "Generated proforma PDF attachment is required." }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(payload.attachmentBase64, "base64");
    if (!pdfBuffer.length || pdfBuffer.subarray(0, 4).toString("utf8") !== "%PDF") {
      return NextResponse.json({ ok: false, error: "Invalid generated proforma PDF attachment." }, { status: 400 });
    }

    const attachmentsJson = JSON.stringify([
      { filename: proformaPdfFilename(d.quoteId), contentType: "application/pdf", base64: payload.attachmentBase64 }
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
