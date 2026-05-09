"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/app/components/cart-store";

export default function CheckoutClient() {
  const params = useSearchParams();
  const { items, couponCode, discountPercent } = useCart();

  const queryTotal = Number(params.get("total") || 0);
  const queryName = params.get("name") || "";
  const queryEmail = params.get("email") || "";
  const queryOrg = params.get("organization") || "";
  const queryAddress = params.get("address") || "";
  const queryState = params.get("state") || "";
  const queryPincode = params.get("pincode") || "";
  const queryGst = params.get("gst") || "";
  const queryQuoteId = params.get("quoteId") || "";
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  const cartSubtotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.qty, 0), [items]);
  const subtotal = queryTotal > 0 ? queryTotal : cartSubtotal;
  const discount = queryTotal > 0 ? 0 : Math.round((subtotal * discountPercent) / 100);
  const taxable = subtotal - discount;
  const cgst = Math.round(taxable * 0.09 * 10) / 10;
  const sgst = Math.round(taxable * 0.09 * 10) / 10;
  const total = Math.round((taxable + cgst + sgst) * 10) / 10;

  const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  async function completePayment() {
    setOrderMessage("");
    setPlacingOrder(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerName: queryName,
        email: queryEmail,
        organization: queryOrg || null,
        address: queryAddress,
        state: queryState,
        pincode: queryPincode,
        gstNumber: queryGst || null,
        quoteId: queryQuoteId || null,
        currency: "INR",
        subtotal,
        discount,
        cgst,
        sgst,
        total,
        couponCode: couponCode || null,
        items: items.map((it) => ({
          journalName: it.journalName,
          subject: it.subject,
          issn: it.issn,
          image: it.image,
          year: it.year,
          issue: it.issue || null,
          plan: it.plan,
          unitPrice: it.unitPrice,
          qty: it.qty
        }))
      })
    });
    const json = (await res.json()) as { ok: boolean; error?: string; order?: { id: string } };
    setPlacingOrder(false);
    if (!json.ok) {
      setOrderMessage(json.error || "Order failed.");
      return;
    }
    setOrderMessage(`Order placed successfully. Order ID: ${json.order?.id || "-"}`);
  }

  return (
    <main className="checkout-page">
      <Link href="/cart" className="checkout-back">← Back to Cart</Link>
      <div className="checkout-grid">
        <section className="checkout-card">
          <h1>Checkout Details</h1>
          <div className="checkout-fields">
            <div><label>FULL NAME *</label><input defaultValue={queryName} /></div>
            <div><label>EMAIL ADDRESS *</label><input defaultValue={queryEmail} /></div>
            <div className="checkout-full"><label>ORGANIZATION / INSTITUTION NAME</label><input defaultValue={queryOrg} /></div>
            <div className="checkout-full"><label>BILLING ADDRESS *</label><textarea defaultValue={queryAddress} /></div>
            <div><label>STATE *</label><input defaultValue={queryState} /></div>
            <div><label>PINCODE *</label><input defaultValue={queryPincode} /></div>
            <div><label>GST NUMBER (OPTIONAL)</label><input defaultValue={queryGst} /></div>
          </div>
          <div className="checkout-note">Your data is secure. We follow strict data protection guidelines and encrypted connections.</div>
        </section>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>
          <p><span>Subtotal</span><strong>{money(subtotal)}</strong></p>
          <p><span>Discount {couponCode ? `(${couponCode})` : ""}</span><strong>-{money(discount)}</strong></p>
          <p><span>CGST (9%)</span><strong>{money(cgst)}</strong></p>
          <p><span>SGST (9%)</span><strong>{money(sgst)}</strong></p>
          <p className="checkout-total"><span>Total</span><strong>{money(total)}</strong></p>
          <button type="button" onClick={completePayment} disabled={placingOrder}>{placingOrder ? "Processing..." : "Complete Payment"}</button>
          {orderMessage ? <p>{orderMessage}</p> : null}
        </aside>
      </div>
    </main>
  );
}
