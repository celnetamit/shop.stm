import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    await sendTemplatedEmail("PROFORMA_CREATED", d.email, d);
    await sendAdminNotification("PROFORMA_CREATED_ADMIN", d);

    return NextResponse.json({ ok: true, message: "Notifications dispatched successfully." });
  } catch (err) {
    console.error("Manual notify error", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
