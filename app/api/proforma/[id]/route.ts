export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { formatPiNumber, resolvePiNumber } from "@/lib/pi-number";
import { quoteTotals } from "@/lib/pricing";

async function findProformaQuote(idOrPiNumber: string) {
  const direct = await prisma.proformaQuote.findUnique({
    where: { id: idOrPiNumber },
    include: { items: true }
  });
  if (direct) return direct;

  // N1: direct indexed lookup by stored PI number (new format, e.g. PRO-2026-5001).
  try {
    const byPi = await prisma.proformaQuote.findUnique({
      where: { piNumber: idOrPiNumber },
      include: { items: true }
    });
    if (byPi) return byPi;
  } catch {
    // piNumber column not present yet (pre-migration) — fall through to legacy lookup.
  }

  // Legacy derived PI numbers contain "/". Bounded scan kept for backward compatibility.
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
    include: { items: true }
  });
}

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

    const quote = await findProformaQuote(id);

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

    // Single source of truth for the money math (see lib/pricing.ts).
    const { subtotal, discount: discountAmt, cgst, sgst, total } = quoteTotals(quote);

    return NextResponse.json({
      ok: true,
      quote: {
        id: quote.id,
        piNumber: resolvePiNumber(quote),
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
    if (!existingQuote) {
      return NextResponse.json({ ok: false, error: "Requested document missing." }, { status: 404 });
    }
    if (existingQuote.createdByUserId && existingQuote.createdByUserId !== session.sub && session.role !== "ADMIN") {
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to submit quote:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit quote. Please try again." },
      { status: 500 }
    );
  }
}
