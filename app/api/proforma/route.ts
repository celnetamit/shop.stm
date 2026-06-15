export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api-error";
import { assignPiNumber } from "@/lib/pi-allocator";

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

    try {
      const quote = await prisma.proformaQuote.create({
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
          createdByUserId: session?.sub || null
        }
      });
      // N1: allocate a stable, unique PI number (best-effort; falls back to derived format).
      const piNumber = await assignPiNumber(quote.id, quote.createdAt);
      return NextResponse.json({ ok: true, quoteId: quote.id, quoteCreatedAt: quote.createdAt, piNumber });
    } catch (dbError) {
      if (!isMissingTableError(dbError)) throw dbError;
      // Graceful fallback for environments where migrations are not applied yet.
      return NextResponse.json({ ok: true, quoteId: `draft-${Date.now()}`, warning: "DB table missing" });
    }
  } catch (error) {
    return errorResponse("proforma.POST", error, "Failed to create quote.");
  }
}
