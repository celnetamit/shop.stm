"use client";

import { useEffect, useState } from "react";

type Coupon = { id: string; code: string; discount: number; isActive: boolean };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/coupons", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; coupons?: Coupon[]; error?: string };
    if (!json.ok) {
      setError(json.error || "Failed to load coupons");
      return;
    }
    setCoupons(json.coupons || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, discount, isActive: true })
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setError(json.error || "Failed to create coupon");
      return;
    }
    setCode("");
    setDiscount(10);
    await load();
  }

  async function toggle(coupon: Coupon) {
    if (coupon.id.startsWith("fallback-")) return;
    await fetch(`/api/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive })
    });
    await load();
  }

  async function removeCoupon(id: string) {
    if (id.startsWith("fallback-")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <section className="admin-coupons">
      <h2>Coupons</h2>
      <form onSubmit={createCoupon} className="admin-coupon-form">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" required />
        <input
          type="number"
          min={1}
          max={100}
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          placeholder="Discount %"
          required
        />
        <button type="submit">Create Coupon</button>
      </form>
      {error ? <p className="auth-error">{error}</p> : null}

      <div className="admin-coupon-list">
        {coupons.map((c) => (
          <div key={c.id} className="admin-coupon-row">
            <strong>{c.code}</strong>
            <span>{c.discount}%</span>
            <span>{c.isActive ? "Active" : "Inactive"}</span>
            <button type="button" onClick={() => toggle(c)}>{c.isActive ? "Disable" : "Enable"}</button>
            <button type="button" onClick={() => removeCoupon(c.id)} disabled={c.id.startsWith("fallback-")}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}
