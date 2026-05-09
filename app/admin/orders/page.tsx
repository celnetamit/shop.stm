"use client";

import { useEffect, useState } from "react";

type OrderItem = { id: string; journalName: string; selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE"; year: string; issue: string | null; qty: number; unitPrice: number };
type Order = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  currency: "INR" | "USD";
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  user: { id: string; email: string } | null;
  items: OrderItem[];
};

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; orders?: Order[]; error?: string; warning?: string };
    if (!json.ok) return setError(json.error || "Failed to load orders");
    setError(json.warning || "");
    setRows(json.orders || []);
  }

  useEffect(() => { void load(); }, []);

  async function updateStatus(id: string, status: Order["status"]) {
    await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <section className="admin-page">
      <h1>Orders</h1>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Created By User</th><th>Total</th><th>Status</th><th>Item Details</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.customerName}</strong><br />{r.email}</td>
                <td>{r.user?.email || "Guest/Unknown"}</td>
                <td>{r.currency} {r.total}</td>
                <td>
                  <select value={r.status} onChange={(e) => void updateStatus(r.id, e.target.value as Order["status"])}>
                    <option value="PENDING">PENDING</option><option value="PAID">PAID</option><option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
                <td>
                  {r.items.length === 0 ? "No item rows" : r.items.map((it) => (
                    <div key={it.id}>{it.journalName} | {it.selectedPlan} | Year {it.year}{it.issue ? ` | Issue ${it.issue}` : ""} | Qty {it.qty} | ₹{it.unitPrice}</div>
                  ))}
                </td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
