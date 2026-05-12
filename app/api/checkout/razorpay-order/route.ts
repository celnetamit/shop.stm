import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || ""
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { amount: number; currency?: string };

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid amount specified." }, { status: 400 });
    }

    // Razorpay requires amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(body.amount * 100);

    const options = {
      amount: amountInPaise,
      currency: body.currency || "INR",
      receipt: `rcpt_${Date.now()}`
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      ok: true,
      id: order.id,
      currency: order.currency,
      amount: order.amount
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to register payment intent." },
      { status: 500 }
    );
  }
}
