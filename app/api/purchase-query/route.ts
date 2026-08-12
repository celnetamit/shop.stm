export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExternalId, captureLead, leadSourceUrl } from "@/lib/leadhub";

// Purchase query intake. While the online payment gateway is switched off on
// checkout, the "Send Query to Management" button lands here: we persist the
// enquiry as a ContactEntry, push it to LeadHub, and notify the team so that
// sales can follow up with the customer manually.

type QueryItem = {
  journalName?: string;
  issn?: string;
  plan?: string;
  selectedPlan?: string;
  year?: string | number;
  issue?: string | null;
  unitPrice?: number;
  qty?: number;
};

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      organization?: string;
      address?: string;
      state?: string;
      pincode?: string;
      gst?: string;
      quoteId?: string | null;
      couponCode?: string | null;
      subtotal?: number;
      discount?: number;
      total?: number;
      note?: string;
      items?: QueryItem[];
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!name || !email) {
      return NextResponse.json({ ok: false, error: "Name and email are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email format" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "No journals selected for this query" }, { status: 400 });
    }

    const itemLines = items.map((it, idx) => {
      const plan = String(it.plan || it.selectedPlan || "").replace("_", " + ");
      const qty = Number(it.qty || 1);
      const lineTotal = Number(it.unitPrice || 0) * qty;
      return [
        `${idx + 1}. ${it.journalName || "Untitled"}`,
        it.issn ? ` | ISSN: ${it.issn}` : "",
        plan ? ` | Plan: ${plan}` : "",
        it.year ? ` | Year: ${it.year}` : "",
        it.issue ? ` | Issue: ${it.issue}` : "",
        ` | Qty: ${qty}`,
        ` | ${money(lineTotal)}`
      ].join("");
    });

    const message = [
      `Purchase query raised from checkout (online payment temporarily disabled).`,
      ``,
      `SELECTED ITEMS (${items.length}):`,
      ...itemLines,
      ``,
      `Subtotal: ${money(Number(body.subtotal || 0))}`,
      body.couponCode ? `Coupon: ${body.couponCode}` : null,
      Number(body.discount || 0) > 0 ? `Discount: -${money(Number(body.discount))}` : null,
      `Indicative Total: ${money(Number(body.total || 0))}`,
      ``,
      `BILLING DETAILS:`,
      body.organization ? `Organization: ${body.organization}` : null,
      body.address ? `Address: ${body.address}` : null,
      body.state ? `State: ${body.state}` : null,
      body.pincode ? `Pincode: ${body.pincode}` : null,
      body.gst ? `GST: ${body.gst}` : null,
      body.quoteId ? `Proforma Reference: ${body.quoteId}` : null,
      body.note?.trim() ? `\nCustomer note:\n${body.note.trim()}` : null
    ]
      .filter((line) => line !== null)
      .join("\n");

    const subject = body.quoteId
      ? `Purchase Query — Proforma ${body.quoteId} (${items.length} item${items.length > 1 ? "s" : ""})`
      : `Purchase Query — ${items.length} journal${items.length > 1 ? "s" : ""} selected`;

    const entry = await prisma.contactEntry.create({
      data: {
        name,
        email,
        phone: body.phone?.trim() || null,
        subject,
        message
      }
    });

    captureLead({
      eventType: "contact_enquiry",
      externalId: buildExternalId("contact_enquiry", entry.id),
      createdAt: entry.createdAt,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      institution: body.organization?.trim() || null,
      message: `${entry.subject}\n\n${entry.message}`,
      journals: items.map((it) => ({
        title: it.journalName || null,
        issn: it.issn || null,
        qty: Number(it.qty || 1)
      })),
      currency: "INR",
      valueEstimate: Number(body.total || 0),
      sourceUrl: leadSourceUrl(req.headers, "/checkout")
    });

    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const d = { name: entry.name, email: entry.email, subject: entry.subject, message: entry.message };
      await sendTemplatedEmail("CONTACT_RECEIVED", entry.email, d);
      await sendAdminNotification("CONTACT_RECEIVED_ADMIN", d);
    } catch (e) {
      console.error("Purchase query notification error", e);
    }

    return NextResponse.json({ ok: true, referenceId: entry.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to submit purchase query" },
      { status: 500 }
    );
  }
}
