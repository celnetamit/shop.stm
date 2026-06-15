export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { computeTotals, computeCouponDiscountAmount, computeSubtotal, isUnderpaid, quoteTotals } from "@/lib/pricing";
import { buildCatalogPriceLookup } from "@/lib/journal-catalog";

// Max times one customer may redeem the same coupon (N5). No schema change needed —
// we count prior PAID orders. Could be promoted to a per-coupon column later.
const PER_USER_COUPON_LIMIT = 1;

// Resolve the authoritative discount for a coupon code SERVER-SIDE. The client's
// posted `discount` is never trusted — otherwise a user could claim an arbitrary
// discount and pay the reduced amount. Mirrors /api/coupons validation (incl. the
// hardcoded MANISH10 fallback used by /api/coupons listing) and enforces a per-user cap.
async function resolveCouponDiscount(
  code: string | null | undefined,
  subtotal: number,
  identity: { userId: string | null; email: string | null }
): Promise<number> {
  if (!code) return 0;
  const upper = code.trim().toUpperCase();
  if (!upper) return 0;

  const coupon = await prisma.coupon.findUnique({ where: { code: upper } }).catch(() => null);

  let baseDiscount = 0;
  if (!coupon) {
    // Fallback promo surfaced by /api/coupons when no DB row exists.
    baseDiscount = upper === "MANISH10" ? computeCouponDiscountAmount("PERCENTAGE", 10, subtotal) : 0;
  } else {
    const now = new Date();
    if (!coupon.isActive) return 0;
    if (coupon.validFrom && now < coupon.validFrom) return 0;
    if (coupon.validUntil && now > coupon.validUntil) return 0;
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return 0;
    if (subtotal < coupon.minOrderAmount) return 0;

    baseDiscount = computeCouponDiscountAmount(coupon.type, coupon.value, subtotal);
  }

  if (baseDiscount <= 0) return 0;

  // Per-user cap: block a customer who already redeemed this coupon on a prior PAID order.
  const idClauses = [
    ...(identity.userId ? [{ userId: identity.userId }] : []),
    ...(identity.email ? [{ email: identity.email }] : [])
  ];
  if (idClauses.length > 0) {
    const priorUses = await prisma.order
      .count({ where: { status: "PAID", couponCode: upper, OR: idClauses } })
      .catch(() => 0);
    if (priorUses >= PER_USER_COUPON_LIMIT) return 0;
  }

  return baseDiscount;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      customerName?: string;
      email?: string;
      organization?: string;
      address?: string;
      state?: string;
      pincode?: string;
      sameAsBilling?: boolean;
      receiverName?: string | null;
      receiverInstitute?: string | null;
      receiverAddress?: string | null;
      receiverPincode?: string | null;
      receiverCity?: string | null;
      receiverState?: string | null;
      receiverCountry?: string | null;
      receiverPhone?: string | null;
      gstNumber?: string;
      quoteId?: string;
      currency?: "INR" | "USD";
      subtotal?: number;
      discount?: number;
      cgst?: number;
      sgst?: number;
      total?: number;
      couponCode?: string;
      items?: Array<{
        journalName: string;
        subject: string;
        issn?: string | null;
        image?: string | null;
        year: string;
        issue?: string | null;
        plan: "PRINT" | "ONLINE" | "PRINT_ONLINE";
        unitPrice: number;
        qty: number;
      }>;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };

    if (!body.customerName || !body.email || !body.address || !body.state || !body.pincode || !Number.isFinite(body.total)) {
      return NextResponse.json({ ok: false, error: "Missing required contact/total fields" }, { status: 400 });
    }

    const customerName = body.customerName.trim();
    const email = body.email.trim().toLowerCase();
    const address = body.address.trim();
    const state = body.state.trim();
    const pincode = body.pincode.trim();
    const razorpayOrderId = body.razorpayOrderId!;
    const razorpayPaymentId = body.razorpayPaymentId!;
    const razorpaySignature = body.razorpaySignature!;

    // Cryptographically Verify the Razorpay Payment Authenticity
    if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      return NextResponse.json({ ok: false, error: "Missing secure payment tokens." }, { status: 400 });
    }

    const crypto = await import("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature !== razorpaySignature) {
      return NextResponse.json({ ok: false, error: "Critical: Payment signature verification failed!" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findFirst({
      where: { razorpayOrderId }
    });
    if (existingOrder) {
      return NextResponse.json({ ok: false, error: "Payment already processed." }, { status: 409 });
    }

    const session = await getCurrentSession();

    // Authoritative linked proforma (if any) — source of truth for GST exemption,
    // currency and receiver details. Client-supplied tax fields are never trusted.
    const quoteForReceiver = body.quoteId
      ? await prisma.proformaQuote.findUnique({ where: { id: body.quoteId }, include: { items: true } }).catch(() => null)
      : null;

    // body.items is still used for the recorded line items (it carries year/issue/image).
    const items = body.items || [];

    // FINANCIAL TOTAL is authoritative:
    //  - quote-linked: derived from the quote's OWN stored items + locked discount
    //    (client-posted prices are never trusted).
    //  - cart: recomputed from posted items, with the coupon re-validated server-side.
    let calcSubtotal: number;
    let discountAmt: number;
    let calcCgst: number;
    let calcSgst: number;
    let calcTotal: number;
    let effectiveCouponCode: string | null;

    if (quoteForReceiver) {
      const totals = quoteTotals(quoteForReceiver);
      calcSubtotal = totals.subtotal;
      discountAmt = totals.discount;
      calcCgst = totals.cgst;
      calcSgst = totals.sgst;
      calcTotal = totals.total;
      effectiveCouponCode = quoteForReceiver.couponCode?.trim().toUpperCase() || null;
    } else {
      // Phase 3b: floor each cart item's price at the authoritative catalog price so a
      // tampered (under-priced) item is rejected. Unmatched items or a catalog-load failure
      // degrade to no validation, so a legitimate order is never falsely rejected.
      try {
        const catalogPrice = await buildCatalogPriceLookup();
        for (const it of items) {
          const authoritative = catalogPrice({ issn: it.issn, journalName: it.journalName, plan: it.plan });
          if (authoritative !== null && Math.round(it.unitPrice || 0) + 1 < authoritative) {
            console.error(`Cart price below catalog: item="${it.journalName}" sent=${it.unitPrice} catalog=${authoritative}`);
            return NextResponse.json(
              { ok: false, error: "Item pricing could not be verified. Please refresh your cart and try again." },
              { status: 400 }
            );
          }
        }
      } catch (e) {
        console.error("Cart catalog price validation skipped:", e);
      }

      const pricingItems = items.map((it) => ({ unitPrice: it.unitPrice, qty: it.qty, plan: it.plan }));
      const preSubtotal = computeSubtotal(pricingItems);
      effectiveCouponCode = (body.couponCode || "").trim().toUpperCase() || null;
      discountAmt = await resolveCouponDiscount(effectiveCouponCode, preSubtotal, {
        userId: session?.sub || null,
        email
      });
      const totals = computeTotals({
        items: pricingItems,
        isINR: body.currency !== "USD",
        isExempt: false,
        discountAmount: discountAmt
      });
      calcSubtotal = totals.subtotal;
      calcCgst = totals.cgst;
      calcSgst = totals.sgst;
      calcTotal = totals.total;
    }

    // SECURITY: reconcile the amount Razorpay actually captured against our server-computed
    // total. The HMAC signature only proves the payment matches the order id, NOT the amount —
    // without this a user could create a ₹1 Razorpay order, pay it, then post a full item list.
    try {
      const Razorpay = (await import("razorpay")).default;
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || ""
      });
      const rzpOrder = await rzp.orders.fetch(razorpayOrderId);
      const paidPaise = Number(rzpOrder.amount_paid ?? rzpOrder.amount ?? 0);
      const expectedPaise = Math.round(calcTotal * 100);
      // Reject only clear underpayment (allow a 1-unit rounding tolerance).
      if (isUnderpaid(paidPaise, expectedPaise)) {
        console.error(`Payment underpaid: paid=${paidPaise} expected=${expectedPaise} order=${razorpayOrderId}`);
        return NextResponse.json(
          { ok: false, error: "Paid amount does not match the order total. Please contact support." },
          { status: 400 }
        );
      }
    } catch (verifyErr) {
      console.error("Razorpay amount reconciliation failed:", verifyErr);
      return NextResponse.json(
        { ok: false, error: "Unable to verify payment amount. Please contact support." },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: session?.sub || null,
          customerName,
          email,
          organization: body.organization?.trim() || null,
          address,
          state,
          pincode,
          sameAsBilling: body.sameAsBilling ?? quoteForReceiver?.sameAsBilling ?? true,
          receiverName: body.receiverName || quoteForReceiver?.receiverName || null,
          receiverInstitute: body.receiverInstitute || quoteForReceiver?.receiverInstitute || null,
          receiverAddress: body.receiverAddress || quoteForReceiver?.receiverAddress || null,
          receiverPincode: body.receiverPincode || quoteForReceiver?.receiverPincode || null,
          receiverCity: body.receiverCity || quoteForReceiver?.receiverCity || null,
          receiverState: body.receiverState || quoteForReceiver?.receiverState || null,
          receiverCountry: body.receiverCountry || quoteForReceiver?.receiverCountry || null,
          receiverPhone: body.receiverPhone || quoteForReceiver?.receiverPhone || null,
          gstNumber: body.gstNumber?.trim() || null,
          quoteId: body.quoteId?.trim() || null,
          // Quote orders record the quote's currency; cart orders are INR.
          currency: quoteForReceiver ? quoteForReceiver.currency : body.currency === "USD" ? "USD" : "INR",
          subtotal: calcSubtotal,
          discount: discountAmt,
          cgst: calcCgst,
          sgst: calcSgst,
          total: calcTotal,
          couponCode: effectiveCouponCode,
          status: "PAID",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          items: {
            create: items.map((it) => ({
              journalName: it.journalName,
              subject: it.subject,
              issn: it.issn || null,
              image: it.image || null,
              year: String(it.year),
              issue: it.issue || null,
              selectedPlan: it.plan,
              unitPrice: Math.max(0, Math.round(it.unitPrice || 0)),
              qty: Math.max(1, Math.round(it.qty || 1))
            }))
          }
        }
      });

      if (created.couponCode) {
        await tx.coupon.update({
          where: { code: created.couponCode },
          data: { usedCount: { increment: 1 } }
        }).catch(() => {});
      }

      return created;
    });

    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const { buildOrderPdfAttachment } = await import("@/lib/email-attachments");
      const invoiceAttachment = await buildOrderPdfAttachment(order.id);
      const attachmentsJson = invoiceAttachment
        ? JSON.stringify([{ filename: invoiceAttachment.filename, contentType: invoiceAttachment.contentType, base64: invoiceAttachment.data.toString("base64") }])
        : "[]";
      const d = {
        name: order.customerName,
        email: order.email,
        orderId: order.id,
        currency: order.currency,
        total: order.total.toString(),
        couponCode: order.couponCode || "None",
        __attachments: attachmentsJson
      };
      await sendTemplatedEmail("ORDER_CONFIRMED", order.email, d);
      await sendAdminNotification("ORDER_CONFIRMED_ADMIN", d);
    } catch (e) {
      console.error("Order Notify Error", e);
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    // N2: a concurrent confirm can lose the race to the unique constraint on
    // razorpayOrderId — treat that as "already processed" (idempotent), not an error.
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: false, error: "Payment already processed." }, { status: 409 });
    }
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create order. Please contact support." },
      { status: 500 }
    );
  }
}
