"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/components/cart-store";
import AuthRequiredOverlay from "@/app/components/auth-required-overlay";

export default function CartPage() {
  const { items, setQty, removeItem, couponCode, discountPercent, setCoupon } = useCart();
  const [coupon, setCouponInput] = useState(couponCode);
  const [msg, setMsg] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isInternationalUser, setIsInternationalUser] = useState(false);
  const USD_RATE = 83;

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => {
        if (!active) return;
        setIsLoggedOut(!res.ok);
      })
      .catch(() => {
        if (!active) return;
        setIsLoggedOut(true);
      })
      .finally(() => {
        if (!active) return;
        setCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { ok: boolean; isInternational?: boolean }) => {
        if (!active) return;
        setIsInternationalUser(!!json.ok && !!json.isInternational);
      })
      .catch(() => {
        if (!active) return;
        setIsInternationalUser(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function money(valueInInr: number) {
    if (isInternationalUser) return `$${(valueInInr / USD_RATE).toFixed(2)}`;
    return `₹${valueInInr.toLocaleString("en-IN")}`;
  }

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

  const requireAuth = !checkingAuth && isLoggedOut;

  return (
    <>
    <div style={{ filter: requireAuth ? "blur(6px)" : "none", pointerEvents: requireAuth ? "none" : "auto", userSelect: requireAuth ? "none" : "auto" }}>
    <main className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-layout">
        <section className="cart-items">
          {items.length === 0 ? <p>Cart is empty. <Link href="/product-category/journals/agriculture">Browse agriculture journals</Link></p> : null}
          {items.map((it) => {
            const lowerName = (it.journalName || "").toLowerCase();
            const lowerSubject = (it.subject || "").toLowerCase();
            const isBook =
              lowerSubject.includes("book") ||
              lowerSubject.includes("monograph") ||
              lowerSubject.includes("nstc") ||
              lowerName.includes("book") ||
              lowerName.includes("monograph") ||
              lowerName.includes("handbook") ||
              lowerName.includes("textbook");
            const itemHsn = it.plan === "ONLINE" ? "998431" : isBook ? "4901" : "4902";

            return (
              <article key={it.id} className="cart-row">
                <img src={it.image} alt={it.journalName} />
                <div>
                  <h3>{it.journalName}</h3>
                  <p>{it.plan.replace("_", " + ")} | Year {it.year}{it.issue ? ` | Issue ${it.issue}` : ""}</p>
                  <p style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", margin: "4px 0 0 0" }}>
                    <span>{money(it.unitPrice)}</span>
                    <span style={{ fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                      HSN/SAC: {itemHsn}
                    </span>
                  </p>
                </div>
                <div className="cart-qty">
                  <button onClick={() => setQty(it.id, it.qty - 1)}>-</button>
                  <span>{it.qty}</span>
                  <button onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                </div>
                <strong>{money(it.unitPrice * it.qty)}</strong>
                <button className="cart-remove" onClick={() => removeItem(it.id)}>x</button>
              </article>
            );
          })}

          <div className="cart-coupon">
            <input value={coupon} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" />
            <button onClick={applyCoupon}>Apply coupon</button>
          </div>
          {msg ? <p className="proforma-coupon-msg">{msg}</p> : null}
        </section>

        <aside className="cart-summary">
          <h2>Cart Totals</h2>
          {isInternationalUser ? <p style={{ fontSize: "12px", color: "#2563eb", marginTop: 0 }}>USD enforced outside India</p> : null}
          <p><span>Subtotal</span><strong>{money(subtotal)}</strong></p>
          <p><span>Discount {couponCode ? `(${couponCode})` : ""}</span><strong>-{money(discount)}</strong></p>
          <p><span>GST (18%)</span><strong>{money(gst)}</strong></p>
          <p className="cart-total"><span>Total</span><strong>{money(total)}</strong></p>
          <Link href="/checkout" className="cart-checkout-btn">Proceed to checkout</Link>
        </aside>
      </div>
    </main>
    </div>
    <AuthRequiredOverlay
      show={requireAuth}
      title="Login To Access Cart"
      subtitle="Please login to continue with cart and checkout."
    />
    </>
  );
}
