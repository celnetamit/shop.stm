"use client";

import { useEffect, useState } from "react";

type Coupon = { id: string; code: string; discount: number; isActive: boolean; createdAt: string };

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);

  async function load() {
    const res = await fetch("/api/admin/coupons", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; coupons?: Coupon[]; error?: string; warning?: string };
    if (!json.ok) return setError(json.error || "Failed to load coupons");
    setError(json.warning || "");
    setRows(json.coupons || []);
  }

  useEffect(() => { void load(); }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/coupons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, discount, isActive: true }) });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) return setError(json.error || "Failed to create coupon");
    setCode("");
    setDiscount(10);
    await load();
  }

  async function toggle(coupon: Coupon) {
    if (coupon.id.startsWith("fallback-")) return;
    await fetch(`/api/coupons/${coupon.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !coupon.isActive }) });
    await load();
  }

  return (
    <section className="admin-page">
      <h1>Coupons</h1>
      {error ? <p className="auth-error">{error}</p> : null}
      <form onSubmit={createCoupon} className="admin-coupon-form">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" required />
        <input type="number" min={1} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} required />
        <button type="submit">Create Coupon</button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td><td>{r.discount}%</td><td>{r.isActive ? "Active" : "Inactive"}</td><td>{new Date(r.createdAt).toLocaleString()}</td>
                <td><button type="button" onClick={() => void toggle(r)}>{r.isActive ? "Disable" : "Enable"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
