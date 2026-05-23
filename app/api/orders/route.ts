export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      customerName?: string;
      email?: string;
      organization?: string;
      address?: string;
      state?: string;
      pincode?: string;
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

    const items = body.items || [];
    let calcSubtotal = 0;
    for (const it of items) {
      const qty = Math.max(1, Math.round(it.qty || 1));
      const price = Math.max(0, Math.round(it.unitPrice || 0));
      calcSubtotal += price * qty;
    }
    const discountAmt = Math.max(0, Math.round(body.discount || 0));
    const taxable = calcSubtotal - discountAmt;
    const cgstRate = body.currency === "USD" ? 0 : 9;
    const sgstRate = body.currency === "USD" ? 0 : 9;
    const calcCgst = (taxable * cgstRate) / 100;
    const calcSgst = (taxable * sgstRate) / 100;
    const calcTotal = taxable + calcCgst + calcSgst;

    const session = await getCurrentSession();

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
          gstNumber: body.gstNumber?.trim() || null,
          quoteId: body.quoteId?.trim() || null,
          currency: body.currency === "USD" ? "USD" : "INR",
          subtotal: calcSubtotal,
          discount: discountAmt,
          cgst: calcCgst,
          sgst: calcSgst,
          total: calcTotal,
          couponCode: body.couponCode?.trim().toUpperCase() || null,
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
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
