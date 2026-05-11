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
    };

    if (!body.customerName || !body.email || !body.address || !body.state || !body.pincode || !Number.isFinite(body.total)) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const session = await getCurrentSession();
    const order = await prisma.order.create({
      data: {
        userId: session?.sub || null,
        customerName: body.customerName.trim(),
        email: body.email.trim().toLowerCase(),
        organization: body.organization?.trim() || null,
        address: body.address.trim(),
        state: body.state.trim(),
        pincode: body.pincode.trim(),
        gstNumber: body.gstNumber?.trim() || null,
        quoteId: body.quoteId?.trim() || null,
        currency: body.currency === "USD" ? "USD" : "INR",
        subtotal: Math.max(0, Math.round(body.subtotal || 0)),
        discount: Math.max(0, Math.round(body.discount || 0)),
        cgst: Math.max(0, Number(body.cgst || 0)),
        sgst: Math.max(0, Number(body.sgst || 0)),
        total: Math.max(0, Number(body.total || 0)),
        couponCode: body.couponCode?.trim().toUpperCase() || null,
        items: {
          create: (body.items || []).map((it) => ({
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

    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const d = {
        name: order.customerName,
        email: order.email,
        orderId: order.id,
        currency: order.currency,
        total: order.total.toString()
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
