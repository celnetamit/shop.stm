export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Razorpay webhook — a server-to-server safety net so orders are reconciled even if the
// customer closes the tab after payment (the browser callback may never reach /api/orders).
//
// Setup (one-time, in the Razorpay Dashboard → Settings → Webhooks):
//   - URL:    https://<your-domain>/api/webhooks/razorpay
//   - Events: payment.captured, order.paid
//   - Secret: set the same value in the RAZORPAY_WEBHOOK_SECRET env var.

type RzpEntity = { id?: string; order_id?: string };
type RzpEvent = {
  event?: string;
  payload?: { payment?: { entity?: RzpEntity }; order?: { entity?: RzpEntity } };
};

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Verify the signature over the EXACT raw bytes (not a re-serialized object).
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  let event: RzpEvent;
  try {
    event = JSON.parse(raw) as RzpEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  try {
    const type = event.event;
    if (type !== "payment.captured" && type !== "order.paid") {
      // Acknowledge unhandled events so Razorpay doesn't keep retrying.
      return NextResponse.json({ ok: true, ignored: type ?? "unknown" });
    }

    const payment = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const razorpayOrderId = payment?.order_id || orderEntity?.id;
    const razorpayPaymentId = payment?.id || null;

    if (!razorpayOrderId) {
      return NextResponse.json({ ok: true, ignored: "no order id in payload" });
    }

    const existing = await prisma.order.findUnique({ where: { razorpayOrderId } });

    if (!existing) {
      // Payment captured but no order was persisted (customer likely closed the tab
      // before confirmation). The item list isn't in the webhook payload, so this needs
      // manual recovery — log loudly so it isn't silently lost.
      console.error(
        `[razorpay-webhook] CRITICAL: captured payment has no matching order. razorpayOrderId=${razorpayOrderId} paymentId=${razorpayPaymentId}`
      );
      return NextResponse.json({ ok: true, alerted: true });
    }

    // Idempotent: only PENDING -> PAID; an already-PAID order is just acknowledged.
    if (existing.status !== "PAID") {
      await prisma.order.update({
        where: { razorpayOrderId },
        data: { status: "PAID", razorpayPaymentId: razorpayPaymentId || existing.razorpayPaymentId }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[razorpay-webhook] handler error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
