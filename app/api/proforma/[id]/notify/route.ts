import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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

    const { prepareProformaEmailPayload } = await import("@/lib/proforma-email-helper");
    const d = await prepareProformaEmailPayload(id);

    if (!d) {
      return NextResponse.json({ ok: false, error: "Quote failed refinement." }, { status: 404 });
    }

    const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
    const attachmentsJson = payload.attachmentBase64
      ? JSON.stringify([{ filename: `proforma-${d.quoteId}.pdf`, contentType: "application/pdf", base64: payload.attachmentBase64 }])
      : "[]";
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
