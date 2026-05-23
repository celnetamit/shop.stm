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
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

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
                <td style={{padding:"12px"}}>
                  <strong>{r.currency} {r.total.toLocaleString()}</strong>
                </td>
                <td style={{padding:"12px", minWidth:"150px"}}>
                  <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                    <span style={{fontSize:"13px", fontWeight:"600", color:"#334155"}}>
                      {r.items.length} {r.items.length === 1 ? "Item" : "Items"}
                    </span>
                    {r.items.length > 0 && (
                      <button 
                        onClick={() => setSelectedOrderForModal(r)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          width: "30px",
                          height: "30px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "inline-grid",
                          placeItems: "center",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#0f172a"
                        }}
                        aria-label="View selected journals"
                        title="View selected journals"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Items Details Modal Popup */}
      {selectedOrderForModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "650px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                👁️ Order Items Details
              </h3>
              <button 
                onClick={() => setSelectedOrderForModal(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            {/* Order Customer Summary */}
            <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div><strong>Customer:</strong> {selectedOrderForModal.customerName}</div>
                <div><strong>Email:</strong> {selectedOrderForModal.email}</div>
                <div><strong>Order ID:</strong> <span style={{ fontFamily: "monospace" }}>{selectedOrderForModal.id}</span></div>
                <div><strong>Date:</strong> {new Date(selectedOrderForModal.createdAt).toLocaleString()}</div>
              </div>
            </div>
            
            {/* Modal Content Scroll Area */}
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                    <th style={{ padding: "10px 8px" }}>Journal Name</th>
                    <th style={{ padding: "10px 8px", textAlign: "left" }}>Variant</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>Plan</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>HSN/SAC</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderForModal.items.map((it) => {
                    const hsn = getHsnCode(it.journalName, it.subject || "", it.selectedPlan);
                    return (
                      <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 8px" }}>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>{it.journalName}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{it.subject}</div>
                        </td>
                        <td style={{ padding: "12px 8px", color: "#334155", fontSize: "12px" }}>
                          <div><strong>Year:</strong> {it.year}</div>
                          <div><strong>Issue:</strong> {it.issue || "All"}</div>
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center" }}>
                          <span style={{ 
                            background: it.selectedPlan === "PRINT_ONLINE" ? "#dbeafe" : it.selectedPlan === "ONLINE" ? "#ecfdf5" : "#fff7ed",
                            color: it.selectedPlan === "PRINT_ONLINE" ? "#1e40af" : it.selectedPlan === "ONLINE" ? "#065f46" : "#9a3412",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}>
                            {it.selectedPlan}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center", color: "#2563eb", fontWeight: "600" }}>{hsn}</td>
                        <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: "600" }}>{it.qty}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "600", color: "#0f172a" }}>
                          {selectedOrderForModal.currency} {it.unitPrice.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Summary */}
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "2px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "15px", fontWeight: "bold" }}>
              <span style={{ color: "#475569" }}>Total Order Amount:</span>
              <span style={{ color: "#2563eb", fontSize: "18px" }}>
                {selectedOrderForModal.currency} {selectedOrderForModal.total.toLocaleString()}
              </span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button 
                onClick={() => setSelectedOrderForModal(null)}
                style={{
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
