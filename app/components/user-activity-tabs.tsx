"use client";

import { useState } from "react";
import Link from "next/link";

export default function UserActivityTabs({ proformas = [], contacts = [], agencies = [], orders = [] }: any) {
  const [activeTab, setActiveTab] = useState(orders.length > 0 ? "orders" : "proforma");

  const tabStyle = (isActive: boolean) => ({
    padding: "14px 28px",
    background: "none",
    border: "none",
    borderBottom: isActive ? "3px solid #2563EB" : "3px solid transparent",
    cursor: "pointer",
    fontWeight: isActive ? "700" : "600",
    color: isActive ? "#2563EB" : "#64748B",
    fontSize: "15px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    outline: "none",
    whiteSpace: "nowrap" as const
  });

  function renderStatusBadge(status: string) {
    const clean = (status || "").toUpperCase();
    let bg = "#F1F5F9";
    let color = "#475569";
    
    if (clean.includes("PAID") || clean.includes("SUCCESS") || clean.includes("CONFIRMED")) {
      bg = "#DCFCE7"; color = "#166534";
    } else if (clean.includes("PENDING") || clean.includes("SUBMITTED") || clean.includes("IN REVIEW")) {
      bg = "#FEF3C7"; color = "#92400E";
    } else if (clean.includes("FAILED") || clean.includes("CANCELLED")) {
      bg = "#FEE2E2"; color = "#991B1B";
    } else if (clean.includes("COMPLETED")) {
      bg = "#DBEAFE"; color = "#1E40AF";
    }

    return (
      <span style={{ 
        background: bg, 
        color: color, 
        padding: "4px 10px", 
        borderRadius: "9999px", 
        fontSize: "12px", 
        fontWeight: "700",
        letterSpacing: "0.02em",
        display: "inline-block"
      }}>
        {clean}
      </span>
    );
  }

  return (
    <div className="user-activity-container" style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)" }}>
      
      {/* Animated and styled navigation header */}
      <div className="tabs-header" style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", overflowX: "auto" }}>
        <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>
          🛒 Orders & Invoices 
          <span style={{ background: activeTab === "orders" ? "#DBEAFE" : "#E2E8F0", color: activeTab === "orders" ? "#1E40AF" : "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{orders.length}</span>
        </button>
        <button onClick={() => setActiveTab("proforma")} style={tabStyle(activeTab === "proforma")}>
          📄 Proforma Quotes 
          <span style={{ background: activeTab === "proforma" ? "#DBEAFE" : "#E2E8F0", color: activeTab === "proforma" ? "#1E40AF" : "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{proformas.length}</span>
        </button>
        <button onClick={() => setActiveTab("contact")} style={tabStyle(activeTab === "contact")}>
          💬 Contact Enquiries 
          <span style={{ background: activeTab === "contact" ? "#DBEAFE" : "#E2E8F0", color: activeTab === "contact" ? "#1E40AF" : "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{contacts.length}</span>
        </button>
        <button onClick={() => setActiveTab("agency")} style={tabStyle(activeTab === "agency")}>
          🤝 Agency Queries 
          <span style={{ background: activeTab === "agency" ? "#DBEAFE" : "#E2E8F0", color: activeTab === "agency" ? "#1E40AF" : "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>{agencies.length}</span>
        </button>
      </div>

      <div className="tab-content" style={{ padding: "24px" }}>
        
        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Order Reference</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Items Purchased</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Total Amount</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                      No order history discovered yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o: any, idx: number) => (
                    <tr key={o.id} style={{ borderTop: "1px solid #E2E8F0", background: idx % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                      <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1E293B", fontSize: "13px" }}>
                        #{o.id.substring(0, 8)}...
                        <div style={{ color: "#64748B", fontSize: "10px", fontWeight: "normal", marginTop: "2px" }}>Ref: {o.id}</div>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>
                        {o.items?.length || 0} journal(s)
                      </td>
                      <td style={{ padding: "14px 18px", fontWeight: "800", color: "#0F172A", fontSize: "13px" }}>
                        {o.currency} {Number(o.total).toLocaleString()}
                      </td>
                      <td style={{ padding: "14px 18px" }}>{renderStatusBadge(o.status)}</td>
                      <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <Link 
                          href={`/account/orders/${o.id}/invoice`} 
                          target="_blank"
                          style={{ 
                            padding: "8px 14px", 
                            background: "#10B981", 
                            color: "white", 
                            borderRadius: "6px", 
                            textDecoration: "none", 
                            fontSize: "13px", 
                            fontWeight: "600", 
                            display: "inline-block", 
                            transition: "background 0.2s" 
                          }}
                          onMouseOver={e => e.currentTarget.style.background = "#059669"}
                          onMouseOut={e => e.currentTarget.style.background = "#10B981"}
                        >
                          📄 Download Invoice
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Proforma Tab */}
        {activeTab === "proforma" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Organization</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Items</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Created</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {proformas.length === 0 ? <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>No proforma quotes created yet.</td></tr> : proformas.map((p: any, idx: number) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #E2E8F0", background: idx % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1E293B" }}>{p.organization}</td>
                    <td style={{ padding: "14px 18px" }}>{renderStatusBadge(p.status)}</td>
                    <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{p.items?.length || 0} journals</td>
                    <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 18px" }}><Link href={`/account/proforma/${p.id}`} style={{ padding: "8px 14px", background: "#3B82F6", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "inline-block", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#2563EB"} onMouseOut={e => e.currentTarget.style.background = "#3B82F6"}>View & Download</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Subject</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Message</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>No contact queries found.</td></tr> : contacts.map((c: any, idx: number) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #E2E8F0", background: idx % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1E293B" }}>{c.subject}</td>
                    <td style={{ padding: "14px 18px", color: "#475569", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.message}</td>
                    <td style={{ padding: "14px 18px" }}>{renderStatusBadge(c.status)}</td>
                    <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Agency Tab */}
        {activeTab === "agency" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Agency Name</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Specialization</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Message</th>
                  <th style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "700" }}>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {agencies.length === 0 ? <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>No agency queries found.</td></tr> : agencies.map((a: any, idx: number) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #E2E8F0", background: idx % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                    <td style={{ padding: "14px 18px", fontWeight: "700", color: "#1E293B" }}>{a.agencyName}</td>
                    <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{a.specialization}</td>
                    <td style={{ padding: "14px 18px", color: "#475569", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.message || "-"}</td>
                    <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
