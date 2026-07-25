export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { formatPiNumber } from "@/lib/pi-number";
import { computeTotals } from "@/lib/proforma-totals";
import { buildExternalId, captureLead, leadSourceUrl } from "@/lib/leadhub";

async function findProformaQuote(idOrPiNumber: string) {
  const direct = await prisma.proformaQuote.findUnique({
    where: { id: idOrPiNumber },
    include: { items: true, createdBy: true }
  });
  if (direct) return direct;

  if (!idOrPiNumber.includes("/")) return null;

  const candidates = await prisma.proformaQuote.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 1000
  });
  const match = candidates.find((q) => formatPiNumber({ id: q.id, createdAt: q.createdAt }) === idOrPiNumber);
  if (!match) return null;

  return prisma.proformaQuote.findUnique({
    where: { id: match.id },
    include: { items: true, createdBy: true }
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || id.startsWith("draft-")) {
      return NextResponse.json({ ok: false, error: "Draft quotes lack persistent storage." }, { status: 404 });
    }

    const session = await getCurrentSession();

    const quote = await findProformaQuote(id);

    if (!quote) {
      return NextResponse.json({ ok: false, error: "Requested document missing." }, { status: 404 });
    }

    if (quote.createdByUserId && (!session || (quote.createdByUserId !== session.sub && session.role !== "ADMIN"))) {
      return NextResponse.json({ ok: false, error: "Unauthorized: you do not own this quote." }, { status: 403 });
    }

    // Automatically track that user engaged the checkout interface
    try {
      await prisma.proformaQuote.update({
        where: { id },
        data: { hasVisitedCheckout: true }
      });
    } catch (e) {
      console.error("Failed to track checkout visit", e);
    }

    const appliedDiscountPercent = quote.couponPercent || 0;
    let calcSubtotal = 0;
    let calcDiscountAmt = 0;
    let calcTaxable = 0;
    let calcCgst = 0;
    let calcSgst = 0;

    quote.items.forEach((it) => {
      const unitPrice = it.unitPrice;
      const itemDiscount = (unitPrice * appliedDiscountPercent) / 100;
      const itemTaxable = unitPrice - itemDiscount;

      const isDigital = it.selectedPlan === "ONLINE" || it.selectedPlan === "PRINT_ONLINE";
      const isINR = quote.currency === "INR";
      
      let isGstExempt = true;
      const activeRole = session?.role || quote.createdBy?.role;
      if (activeRole) {
        if (activeRole === "LIBRARIAN" || activeRole === "USER") {
          isGstExempt = true;
        } else if (
          activeRole === "AGENCY" ||
          activeRole === "STUDENT" ||
          activeRole === "SCHOLAR"
        ) {
          isGstExempt = false;
        } else {
          isGstExempt = false;
        }
      } else {
        isGstExempt = quote.subscriberCategory === "COLLEGE" || quote.subscriberCategory === "EXISTING_PI";
      }

      const itemGstRate = isINR && isDigital && !isGstExempt ? 18 : 0;

      const itemGst = itemTaxable * (itemGstRate / 100);
      const itemCgst = itemGst / 2;
      const itemSgst = itemGst / 2;

      calcSubtotal += unitPrice;
      calcDiscountAmt += itemDiscount;
      calcTaxable += itemTaxable;
      calcCgst += itemCgst;
      calcSgst += itemSgst;
    });

    const subtotal = Math.round(calcSubtotal * 100) / 100;
    const discountAmt = Math.round(calcDiscountAmt * 100) / 100;
    const taxable = Math.round(calcTaxable * 100) / 100;
    const cgst = Math.round(calcCgst * 100) / 100;
    const sgst = Math.round(calcSgst * 100) / 100;
    const total = Math.round((taxable + cgst + sgst) * 100) / 100;

    return NextResponse.json({
      ok: true,
      quote: {
        id: quote.id,
        organization: quote.organization,
        contactName: quote.contactName,
        email: quote.email,
        address: quote.address || "",
        country: quote.country,
        subscriberCategory: quote.subscriberCategory || "COLLEGE",
        gstNumber: quote.gstNumber || "",
        sameAsBilling: quote.sameAsBilling,
        receiverName: quote.receiverName || "",
        receiverInstitute: quote.receiverInstitute || "",
        receiverAddress: quote.receiverAddress || "",
        receiverPincode: quote.receiverPincode || "",
        receiverCity: quote.receiverCity || "",
        receiverState: quote.receiverState || "",
        receiverCountry: quote.receiverCountry || "",
        receiverPhone: quote.receiverPhone || "",
        items: quote.items.map((it) => ({
          id: it.id,
          journalName: it.journalName,
          subject: it.subject,
          issn: it.issn,
          selectedPlan: it.selectedPlan,
          unitPrice: it.unitPrice,
          qty: 1
        })),
        subtotal,
        discount: discountAmt,
        discountPercent: quote.couponPercent || 0,
        cgst,
        sgst,
        total,
        couponPercent: quote.couponPercent || 0,
        currency: quote.currency
      }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failure interrogating storage." }, { status: 500 });
  }
}

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
    const session = await getCurrentSession();

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

    const existingQuote = await prisma.proformaQuote.findUnique({ where: { id } });
    if (existingQuote && existingQuote.createdByUserId && (!session || (existingQuote.createdByUserId !== session.sub && session.role !== "ADMIN"))) {
      return NextResponse.json({ ok: false, error: "Unauthorized: you do not own this quote." }, { status: 403 });
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

    // The quote is now SUBMITTED with its journals — re-send the lead under the
    // same external_id so LeadHub enriches it with the journal list and value.
    // Kept out of the transaction's try block: the submit already succeeded, so
    // nothing here may turn this response into a failure.
    try {
      const submitted = await prisma.proformaQuote.findUnique({
        where: { id },
        include: { items: true, createdBy: { select: { role: true } } }
      });

      if (submitted) {
        const totals = computeTotals(
          submitted.items.map((it) => ({ unitPrice: it.unitPrice, qty: 1, selectedPlan: it.selectedPlan })),
          {
            currency: submitted.currency,
            discountPercent: submitted.couponPercent || 0,
            role: session?.role || submitted.createdBy?.role,
            subscriberCategory: submitted.subscriberCategory
          }
        );

        captureLead({
          eventType: "proforma_request",
          externalId: buildExternalId("proforma_request", submitted.id),
          createdAt: submitted.createdAt,
          name: submitted.contactName,
          email: submitted.email,
          phone: submitted.phone,
          institution: submitted.institutionName || submitted.organization,
          country: submitted.country,
          designation: submitted.designation,
          message: `Proforma invoice request ${formatPiNumber({ id: submitted.id, createdAt: submitted.createdAt })} — ${submitted.items.length} journal(s).`,
          journals: submitted.items.map((it) => ({ title: it.journalName, issn: it.issn, qty: 1 })),
          currency: submitted.currency,
          valueEstimate: totals.total,
          sourceUrl: leadSourceUrl(req.headers, "/get-proforma-invoice-quote")
        });
      }
    } catch (leadError) {
      console.error("[leadhub] proforma submit lead capture failed", leadError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to submit quote" },
      { status: 500 }
    );
  }
}
