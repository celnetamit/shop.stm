export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    (msg.includes("does not exist") && (msg.includes("proformaquote") || msg.includes("proformaquoteitem"))) ||
    msg.includes("can't reach database server") ||
    msg.includes("prismaclientinitializationerror") ||
    msg.includes("connection refused")
  );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      currency?: "INR" | "USD";
      couponCode?: string | null;
      couponPercent?: number;
      items?: Array<{
        serialNo: number;
        subject: string;
        journalName: string;
        abbreviation: string;
        issn?: string | null;
        selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE";
        unitPrice: number;
      }>;
    };

    const items = body.items || [];
    if (!items.length) {
      return NextResponse.json({ ok: false, error: "Please select at least one journal." }, { status: 400 });
    }

    if (id.startsWith("draft-")) {
      return NextResponse.json({ ok: true, warning: "Draft mode: DB table missing" });
    }

    try {
      await prisma.$transaction([
        prisma.proformaQuoteItem.deleteMany({ where: { quoteId: id } }),
        prisma.proformaQuoteItem.createMany({
          data: items.map((it) => ({
            quoteId: id,
            serialNo: it.serialNo,
            subject: it.subject,
            journalName: it.journalName,
            abbreviation: it.abbreviation,
            issn: it.issn || null,
            selectedPlan: it.selectedPlan,
            currency: body.currency === "USD" ? "USD" : "INR",
            unitPrice: it.unitPrice
          }))
        }),
        prisma.proformaQuote.update({
          where: { id },
          data: {
            status: "SUBMITTED",
            currency: body.currency === "USD" ? "USD" : "INR",
            couponCode: body.couponCode?.trim().toUpperCase() || null,
            couponPercent: Number.isFinite(body.couponPercent) ? Math.max(0, Math.min(100, Math.floor(body.couponPercent || 0))) : 0
          }
        })
      ]);
    } catch (dbError) {
      if (!isMissingTableError(dbError)) throw dbError;
      return NextResponse.json({ ok: true, warning: "Draft mode: DB table missing" });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to submit quote" },
      { status: 500 }
    );
  }
}
