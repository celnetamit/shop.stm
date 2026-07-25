export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { buildExternalId, captureLead, leadSourceUrl } from "@/lib/leadhub";

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
      // Lead captured as soon as the subscriber step is saved. The journals are
      // only known at submit time, so PATCH /api/proforma/[id] re-sends the same
      // external_id later to enrich this lead (LeadHub updates, never dupes).
      captureLead({
        eventType: "proforma_request",
        externalId: buildExternalId("proforma_request", quote.id),
        createdAt: quote.createdAt,
        name: quote.contactName,
        email: quote.email,
        phone: quote.phone,
        institution: quote.institutionName || quote.organization,
        country: quote.country,
        designation: quote.designation,
        currency: quote.currency,
        sourceUrl: leadSourceUrl(req.headers, "/get-proforma-invoice-quote")
      });

      return NextResponse.json({ ok: true, quoteId: quote.id, quoteCreatedAt: quote.createdAt });
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
