import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("does not exist") && msg.includes("proformaquote");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
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

    try {
      const quote = await prisma.proformaQuote.create({
        data: {
          organization: body.organization.trim(),
          contactName: body.contactName.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone.trim(),
          country: body.country.trim(),
          address: body.address?.trim() || null,
          gstNumber: body.gstNumber?.trim() || null,
          currency: body.currency === "USD" ? "USD" : "INR",
          createdByUserId: session?.sub || null
        }
      });
      return NextResponse.json({ ok: true, quoteId: quote.id });
    } catch (dbError) {
      if (!isMissingTableError(dbError)) throw dbError;
      // Graceful fallback for environments where migrations are not applied yet.
      return NextResponse.json({ ok: true, quoteId: `draft-${Date.now()}`, warning: "DB table missing" });
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create quote" },
      { status: 500 }
    );
  }
}
