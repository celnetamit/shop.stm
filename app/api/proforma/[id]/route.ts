export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || id.startsWith("draft-")) {
      return NextResponse.json({ ok: false, error: "Draft quotes lack persistent storage." }, { status: 404 });
    }

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const quote = await prisma.proformaQuote.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!quote) {
      return NextResponse.json({ ok: false, error: "Requested document missing." }, { status: 404 });
    }

    if (quote.createdByUserId && quote.createdByUserId !== session.sub && session.role !== "ADMIN") {
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
      const isGstExemptSubscriber = quote.subscriberCategory === "COLLEGE" || quote.subscriberCategory === "EXISTING_PI";
      const itemGstRate = isINR && isDigital && !isGstExemptSubscriber ? 18 : 0;

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
        gstNumber: quote.gstNumber || "",
        subtotal,
        discount: discountAmt,
        discountPercent: quote.couponPercent || 0,
        cgst,
        sgst,
        total,
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
    if (!session) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

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
    if (existingQuote && existingQuote.createdByUserId && existingQuote.createdByUserId !== session.sub) {
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
      
      // Post-Transaction Async Email Notification
      try {
        const { prepareProformaEmailPayload } = await import("@/lib/proforma-email-helper");
        const d = await prepareProformaEmailPayload(id);
        if (d) {
          const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
          await sendTemplatedEmail("PROFORMA_CREATED", d.email, d);
          await sendAdminNotification("PROFORMA_CREATED_ADMIN", d);
        }
      } catch (emailErr) {
        console.error("⚠️ Proforma email triggers failed", emailErr);
      }
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
