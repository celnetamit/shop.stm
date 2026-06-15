import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { quoteTotals } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Instantiate lazily inside the handler — the Razorpay constructor throws when
// key_id is empty, so creating it at module scope would crash on import (and break
// `next build`/cold start) whenever the env vars are not configured.
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are not configured.");
  }
  return new Razorpay({ key_id, key_secret });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { amount?: number; currency?: string; quoteId?: string };

    let amount: number;
    let currency: string;

    if (body.quoteId && !body.quoteId.startsWith("draft-")) {
      // SERVER-AUTHORITATIVE pricing for quote-linked checkout: the amount is computed
      // from the quote's own stored items + locked discount and is NEVER trusted from
      // the client, so unit prices cannot be tampered with.
      const session = await getCurrentSession();
      if (!session) {
        return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
      }
      const quote = await prisma.proformaQuote.findUnique({
        where: { id: body.quoteId },
        include: { items: true }
      });
      if (!quote) {
        return NextResponse.json({ ok: false, error: "Quote not found." }, { status: 404 });
      }
      if (quote.createdByUserId && quote.createdByUserId !== session.sub && session.role !== "ADMIN") {
        return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
      }
      amount = quoteTotals(quote).total;
      if (quote.currency === "USD") {
        // USD online payment needs Razorpay international payments enabled on the account.
        // Until ENABLE_USD_CHECKOUT=true, block it gracefully rather than charging the USD
        // figure as rupees (the previous N6 bug).
        if (process.env.ENABLE_USD_CHECKOUT !== "true") {
          return NextResponse.json(
            { ok: false, error: "Online USD/international payment isn't available yet — please contact us to complete this order." },
            { status: 400 }
          );
        }
        currency = "USD";
      } else {
        currency = "INR";
      }
    } else {
      // Cart checkout is INR-only; amount supplied by the client (still independently
      // reconciled at /api/orders). TODO (Phase 3b): derive cart prices from the catalog.
      if (!body.amount || body.amount <= 0) {
        return NextResponse.json({ ok: false, error: "Invalid amount specified." }, { status: 400 });
      }
      amount = body.amount;
      currency = "INR";
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Order total must be greater than zero." }, { status: 400 });
    }

    const instance = getRazorpay();
    // Razorpay requires amount in the smallest currency unit (paise for INR).
    const amountInPaise = Math.round(amount * 100);

    const order = await instance.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`
    });

    return NextResponse.json({
      ok: true,
      id: order.id,
      currency: order.currency,
      amount: order.amount
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to register payment intent. Please try again." },
      { status: 500 }
    );
  }
}
