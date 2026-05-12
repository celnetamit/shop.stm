"use client";

import { useEffect, useState } from "react";

type ProformaItem = { id: string; journalName: string; selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE"; unitPrice: number };
type Proforma = {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  status: "DRAFT" | "SUBMITTED" | "PAID";
  hasVisitedCheckout: boolean;
  adminRemarks: string | null;
  createdAt: string;
  items: ProformaItem[];
  createdBy: { id: string; email: string } | null;
};

export default function AdminProformaPage() {
  const [rows, setRows] = useState<Proforma[]>([]);
  const [error, setError] = useState("");
  const [editingRemarks, setEditingRemarks] = useState<Record<string, string>>({});

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

  async function updateRemark(id: string) {
    const remark = editingRemarks[id];
    await fetch(`/api/admin/proforma/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ adminRemarks: remark }) });
    await load();
  }

  return (
    <section className="admin-page" style={{maxWidth: "1300px", margin: "0 auto", padding: "20px"}}>
      <h1 style={{marginBottom:"20px", borderBottom:"2px solid #f1f5f9", paddingBottom:"10px"}}>📄 Proforma Master Dashboard</h1>
      {error ? <p className="auth-error" style={{color:"red"}}>{error}</p> : null}
      <div className="admin-table-wrap" style={{overflowX:"auto"}}>
        <table className="admin-table" style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc", textAlign:"left", fontSize:"13px"}}>
              <th style={{padding:"12px"}}>Organization / Contact</th>
              <th style={{padding:"12px"}}>Engagement Status</th>
              <th style={{padding:"12px"}}>Payment Level</th>
              <th style={{padding:"12px"}}>Admin Confirmation</th>
              <th style={{padding:"12px"}}>Remarks</th>
              <th style={{padding:"12px"}}>Date Generated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{borderBottom:"1px solid #e2e8f0", fontSize:"13px"}}>
                <td style={{padding:"12px"}}>
                  <strong>{r.organization}</strong><br />
                  <span style={{fontSize:"12px", color:"#64748b"}}>{r.contactName} ({r.email})</span>
                </td>
                <td style={{padding:"12px"}}>
                  {r.hasVisitedCheckout ? (
                    <span style={{background:"#dbeafe", color:"#1e40af", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>🔗 VISITED CHECKOUT ✅</span>
                  ) : (
                    <span style={{background:"#f1f5f9", color:"#64748b", padding:"4px 8px", borderRadius:"4px", fontSize:"11px"}}>UNOPENED</span>
                  )}
                </td>
                <td style={{padding:"12px"}}>
                  {r.status === "PAID" ? (
                    <span style={{background:"#dcfce7", color:"#166534", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>PAID</span>
                  ) : r.status === "SUBMITTED" ? (
                    <span style={{background:"#fff7ed", color:"#9a3412", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>ISSUED / PENDING</span>
                  ) : (
                    <span style={{background:"#f1f5f9", color:"#475569", padding:"4px 8px", borderRadius:"4px", fontSize:"11px"}}>DRAFT</span>
                  )}
                </td>
                <td style={{padding:"12px"}}>
                  <select 
                    value={r.status} 
                    onChange={(e) => void updateStatus(r.id, e.target.value as Proforma["status"])}
                    style={{padding:"4px", fontSize:"12px"}}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="PAID">PAID (Admin Force)</option>
                  </select>
                </td>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex", gap:"5px"}}>
                    <input 
                      type="text" 
                      placeholder="Admin note..." 
                      defaultValue={r.adminRemarks || ""}
                      onChange={(e) => setEditingRemarks(prev => ({ ...prev, [r.id]: e.target.value }))}
                      style={{fontSize:"12px", padding:"4px", width:"140px"}}
                    />
                    <button 
                      onClick={() => updateRemark(r.id)}
                      style={{fontSize:"10px", background:"#0f2a57", color:"white", border:"none", padding:"4px 8px", borderRadius:"3px", cursor:"pointer"}}
                    >
                      Save
                    </button>
                  </div>
                </td>
                <td style={{padding:"12px", color:"#64748b"}}>{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
