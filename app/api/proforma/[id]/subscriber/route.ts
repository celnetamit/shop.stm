export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("does not exist") && msg.includes("proformaquote");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      organization?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      country?: string;
      address?: string;
      gstNumber?: string;
      currency?: "INR" | "USD";
    };

    if (!body.organization || !body.contactName || !body.email || !body.phone || !body.country) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    if (id.startsWith("draft-")) {
      return NextResponse.json({ ok: true, quoteId: id, warning: "Draft mode: DB table missing" });
    }

    const session = await getCurrentSession();

    try {
      const quote = await prisma.proformaQuote.update({
        where: { id },
        data: {
          organization: body.organization.trim(),
          contactName: body.contactName.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone.trim(),
          country: body.country.trim(),
          address: body.address?.trim() || null,
          gstNumber: body.gstNumber?.trim() || null,
          currency: body.currency === "USD" ? "USD" : "INR",
          createdByUserId: session?.sub || undefined
        }
      });
      return NextResponse.json({ ok: true, quoteId: quote.id });
    } catch (dbError) {
      if (!isMissingTableError(dbError)) throw dbError;
      return NextResponse.json({ ok: true, quoteId: id, warning: "Draft mode: DB table missing" });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update quote details" },
      { status: 500 }
    );
  }
}

