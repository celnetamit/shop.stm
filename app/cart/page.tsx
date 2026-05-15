"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/app/components/cart-store";

export default function CartPage() {
  const { items, setQty, removeItem, couponCode, discountPercent, setCoupon } = useCart();
  const [coupon, setCouponInput] = useState(couponCode);
  const [msg, setMsg] = useState("");

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.unitPrice * it.qty, 0), [items]);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const taxable = subtotal - discount;
  const gst = Math.round(taxable * 0.18);
  const total = taxable + gst;

  async function applyCoupon() {
    setMsg("");
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCoupon("", 0);
      return;
    }
    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
    const json = (await res.json()) as { ok: boolean; error?: string; coupon?: { code: string; discount: number } };
    if (!json.ok || !json.coupon) {
      setCoupon("", 0);
      setMsg(json.error || "Invalid coupon");
      return;
    }
    setCoupon(json.coupon.code, json.coupon.discount);
    setMsg(`Applied ${json.coupon.code} (${json.coupon.discount}% off)`);
  }

  return (
    <main className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-layout">
        <section className="cart-items">
          {items.length === 0 ? <p>Cart is empty. <Link href="/product-category/journals/agriculture">Browse agriculture journals</Link></p> : null}
          {items.map((it) => (
            <article key={it.id} className="cart-row">
              <img src={it.image} alt={it.journalName} />
              <div>
                <h3>{it.journalName}</h3>
                <p>{it.plan.replace("_", " + ")} | Year {it.year}{it.issue ? ` | Issue ${it.issue}` : ""}</p>
                <p>₹{it.unitPrice.toLocaleString("en-IN")}</p>
              </div>
              <div className="cart-qty">
                <button onClick={() => setQty(it.id, it.qty - 1)}>-</button>
                <span>{it.qty}</span>
                <button onClick={() => setQty(it.id, it.qty + 1)}>+</button>
              </div>
              <strong>₹{(it.unitPrice * it.qty).toLocaleString("en-IN")}</strong>
              <button className="cart-remove" onClick={() => removeItem(it.id)}>x</button>
            </article>
          ))}

          <div className="cart-coupon">
            <input value={coupon} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" />
            <button onClick={applyCoupon}>Apply coupon</button>
          </div>
          {msg ? <p className="proforma-coupon-msg">{msg}</p> : null}
        </section>

        <aside className="cart-summary">
          <h2>Cart Totals</h2>
          <p><span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN")}</strong></p>
          <p><span>Discount {couponCode ? `(${couponCode})` : ""}</span><strong>-₹{discount.toLocaleString("en-IN")}</strong></p>
          <p><span>GST (18%)</span><strong>₹{gst.toLocaleString("en-IN")}</strong></p>
          <p className="cart-total"><span>Total</span><strong>₹{total.toLocaleString("en-IN")}</strong></p>
          <Link href="/checkout" className="cart-checkout-btn">Proceed to checkout</Link>
        </aside>
      </div>
    </main>
  );
}
