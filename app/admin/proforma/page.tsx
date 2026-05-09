"use client";

import { useEffect, useState } from "react";

type ProformaItem = { id: string; journalName: string; selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE"; unitPrice: number };
type Proforma = {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  status: "DRAFT" | "SUBMITTED";
  createdAt: string;
  items: ProformaItem[];
  createdBy: { id: string; email: string } | null;
};

export default function AdminProformaPage() {
  const [rows, setRows] = useState<Proforma[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/proforma", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; proformas?: Proforma[]; error?: string; warning?: string };
    if (!json.ok) return setError(json.error || "Failed to load quotes");
    setError(json.warning || "");
    setRows(json.proformas || []);
  }

  useEffect(() => { void load(); }, []);

  async function updateStatus(id: string, status: Proforma["status"]) {
    await fetch(`/api/admin/proforma/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <section className="admin-page">
      <h1>Proforma / Quote Entries</h1>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Organization</th><th>Contact</th><th>Created By User</th><th>Items</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.organization}</td>
                <td>{r.contactName}<br />{r.email}</td>
                <td>{r.createdBy?.email || "Guest/Unknown"}</td>
                <td>
                  {r.items.length === 0 ? "No items" : r.items.map((it) => (
                    <div key={it.id}>{it.journalName} | {it.selectedPlan} | ₹{it.unitPrice}</div>
                  ))}
                </td>
                <td><select value={r.status} onChange={(e) => void updateStatus(r.id, e.target.value as Proforma["status"])}><option value="DRAFT">DRAFT</option><option value="SUBMITTED">SUBMITTED</option></select></td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
