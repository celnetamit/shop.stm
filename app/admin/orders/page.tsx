"use client";

import { useEffect, useState } from "react";

type OrderItem = { id: string; journalName: string; subject: string; selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE"; year: string; issue: string | null; qty: number; unitPrice: number };
type Order = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  currency: "INR" | "USD";
  status: "PENDING" | "PAID" | "CANCELLED";
  adminRemarks: string | null;
  createdAt: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  user: { id: string; email: string } | null;
  items: OrderItem[];
};

function isBookProduct(journalName: string, subject: string): boolean {
  const lowerName = journalName.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  return (
    lowerSubject.includes("book") ||
    lowerSubject.includes("monograph") ||
    lowerSubject.includes("nstc") ||
    lowerName.includes("book") ||
    lowerName.includes("monograph") ||
    lowerName.includes("handbook") ||
    lowerName.includes("textbook") ||
    lowerName.includes("reference book")
  );
}

function getHsnCode(journalName: string, subject: string, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE"): string {
  if (plan === "ONLINE") return "998431";
  const isBook = isBookProduct(journalName, subject);
  return isBook ? "4901" : "4902";
}

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [editingRemarks, setEditingRemarks] = useState<Record<string, string>>({});

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

  async function updateRemark(id: string) {
    const remark = editingRemarks[id];
    await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ adminRemarks: remark }) });
    await load();
  }

  return (
    <section className="admin-page" style={{maxWidth: "1200px", margin: "0 auto", padding: "20px"}}>
      <h1 style={{marginBottom:"20px", borderBottom:"2px solid #f1f5f9", paddingBottom:"10px"}}>🛒 Master Orders</h1>
      {error ? <p className="auth-error" style={{color:"red"}}>{error}</p> : null}
      <div className="admin-table-wrap" style={{overflowX:"auto"}}>
        <table className="admin-table" style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc", textAlign:"left"}}>
              <th style={{padding:"12px"}}>Customer</th>
              <th style={{padding:"12px"}}>Payment Status</th>
              <th style={{padding:"12px"}}>Action Override</th>
              <th style={{padding:"12px"}}>Admin Remarks</th>
              <th style={{padding:"12px"}}>Transactions & Invoice</th>
              <th style={{padding:"12px"}}>Total</th>
              <th style={{padding:"12px"}}>Items</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{borderBottom:"1px solid #e2e8f0"}}>
                <td style={{padding:"12px"}}>
                  <strong>{r.customerName}</strong><br />
                  <span style={{fontSize:"12px", color:"#64748b"}}>{r.email}</span>
                </td>
                <td style={{padding:"12px"}}>
                  {r.status === "PAID" ? (
                    <span style={{background:"#dcfce7", color:"#166534", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>RECEIVED ✅</span>
                  ) : r.status === "CANCELLED" ? (
                    <span style={{background:"#fee2e2", color:"#991b1b", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>CANCELLED</span>
                  ) : (
                    <span style={{background:"#fef9c3", color:"#854d0e", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>PENDING</span>
                  )}
                </td>
                <td style={{padding:"12px"}}>
                  <select 
                    value={r.status} 
                    onChange={(e) => void updateStatus(r.id, e.target.value as Order["status"])}
                    style={{padding:"4px", fontSize:"12px"}}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex", gap:"5px"}}>
                    <input 
                      type="text" 
                      placeholder="Add note..." 
                      defaultValue={r.adminRemarks || ""}
                      onChange={(e) => setEditingRemarks(prev => ({ ...prev, [r.id]: e.target.value }))}
                      style={{fontSize:"12px", padding:"4px", width:"150px"}}
                    />
                    <button 
                      onClick={() => updateRemark(r.id)}
                      style={{fontSize:"10px", background:"#0f2a57", color:"white", border:"none", padding:"4px 8px", borderRadius:"3px", cursor:"pointer"}}
                    >
                      Save
                    </button>
                  </div>
                </td>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex", flexDirection:"column", gap:"5px"}}>
                    {r.razorpayPaymentId ? (
                      <div style={{fontSize:"11px", color:"#475569"}}>
                        <div>Payment ID: <strong style={{color:"#0f172a"}}>{r.razorpayPaymentId}</strong></div>
                        <div style={{fontSize:"10px", color:"#64748b"}}>Ref: {r.razorpayOrderId || "Direct"}</div>
                      </div>
                    ) : (
                      <div style={{fontSize:"11px", color:"#94a3b8", fontStyle:"italic"}}>No transaction data</div>
                    )}
                    <div>
                      <a 
                        href={`/admin/orders/${r.id}/invoice`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          color: "white",
                          background: "#2563eb",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          textDecoration: "none",
                          fontWeight: "600"
                        }}
                      >
                        📄 View Invoice
                      </a>
                    </div>
                  </div>
                </td>
                <td style={{padding:"12px", fontSize:"11px", minWidth:"200px"}}>
                  {r.items.length === 0 ? "—" : r.items.map((it) => {
                    const hsn = getHsnCode(it.journalName, it.subject || "", it.selectedPlan);
                    return (
                      <div key={it.id} style={{color:"#475569", marginBottom:"6px", borderBottom:"1px dashed #f1f5f9", paddingBottom:"4px"}}>
                        <div style={{fontWeight:"600", color:"#1e293b"}}>{it.journalName}</div>
                        <div style={{color:"#64748b", fontSize:"10px", marginTop:"2px"}}>
                          Plan: <span style={{fontWeight:"bold", color:"#0f172a"}}>{it.selectedPlan}</span> | 
                          HSN/SAC: <span style={{fontWeight:"bold", color:"#2563eb"}}>{hsn}</span> | 
                          Qty: <span style={{fontWeight:"bold", color:"#0f172a"}}>{it.qty}</span>
                        </div>
                      </div>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
