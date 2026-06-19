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
      subscriberCategory?: string;
      institutionName?: string;
      designation?: string;
      country?: string;
      address?: string;
      gstNumber?: string;
      currency?: "INR" | "USD";
      sameAsBilling?: boolean;
      shippingRecipientName?: string;
      shippingInstitute?: string;
      shippingAddress?: string;
      shippingPincode?: string;
      shippingCity?: string;
      shippingState?: string;
      shippingCountry?: string;
      shippingPhone?: string;
    };

    if (!body.organization || !body.contactName || !body.email || !body.phone || !body.country) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const session = await getCurrentSession();

    if (id.startsWith("draft-")) {
      return NextResponse.json({ ok: true, quoteId: id, warning: "Draft mode: DB table missing" });
    }

    try {
      const existingQuote = await prisma.proformaQuote.findUnique({ where: { id } });
      if (existingQuote && existingQuote.createdByUserId && (!session || (existingQuote.createdByUserId !== session.sub && session.role !== "ADMIN"))) {
        return NextResponse.json({ ok: false, error: "Unauthorized: you do not own this quote." }, { status: 403 });
      }

      const quote = await prisma.proformaQuote.update({
        where: { id },
        data: {
          organization: body.organization.trim(),
          contactName: body.contactName.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone.trim(),
          subscriberCategory: body.subscriberCategory?.trim() || "COLLEGE",
          institutionName: body.institutionName?.trim() || null,
          designation: body.designation?.trim() || null,
          country: body.country.trim(),
          address: body.address?.trim() || null,
          sameAsBilling: body.sameAsBilling !== false,
          receiverName: body.shippingRecipientName?.trim() || null,
          receiverInstitute: body.shippingInstitute?.trim() || null,
          receiverAddress: body.shippingAddress?.trim() || null,
          receiverPincode: body.shippingPincode?.trim() || null,
          receiverCity: body.shippingCity?.trim() || null,
          receiverState: body.shippingState?.trim() || null,
          receiverCountry: body.shippingCountry?.trim() || null,
          receiverPhone: body.shippingPhone?.trim() || null,
          gstNumber: body.gstNumber?.trim() || null,
          currency: body.currency === "USD" ? "USD" : "INR",
          createdByUserId: session?.sub || undefined
        }
      });
      return NextResponse.json({ ok: true, quoteId: quote.id, quoteCreatedAt: quote.createdAt });
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
