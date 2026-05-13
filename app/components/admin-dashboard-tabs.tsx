"use client";

import { useState } from "react";

type Props = {
  contacts: any[];
  agencies: any[];
  proformas: any[];
  orders: any[];
};

export default function AdminDashboardTabs({ contacts, agencies, proformas, orders }: Props) {
  const [activeTab, setActiveTab] = useState<"orders" | "proformas" | "agencies" | "contacts">("orders");

  const tabs = [
    { id: "orders", label: "🛒 Recent Orders", count: orders.length },
    { id: "proformas", label: "📄 Proforma Quotes", count: proformas.length },
    { id: "agencies", label: "🤝 Agency Queries", count: agencies.length },
    { id: "contacts", label: "💬 Support Enquiries", count: contacts.length }
  ] as const;

  // Helper to render badges based on status strings
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
    <div style={{ marginTop: "32px" }}>
      {/* Animated Navigation Tab Strip */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        borderBottom: "1px solid #E2E8F0", 
        marginBottom: "24px", 
        paddingBottom: "2px",
        overflowX: "auto"
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: "none",
              border: "none",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: activeTab === t.id ? "700" : "600",
              color: activeTab === t.id ? "#2563EB" : "#64748B",
              cursor: "pointer",
              borderBottom: activeTab === t.id ? "3px solid #2563EB" : "3px solid transparent",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              outline: "none"
            }}
          >
            {t.label}
            <span style={{
              background: activeTab === t.id ? "#DBEAFE" : "#F1F5F9",
              color: activeTab === t.id ? "#1E40AF" : "#64748B",
              fontSize: "11px",
              fontWeight: "bold",
              padding: "2px 8px",
              borderRadius: "999px"
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Dashboard Window */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        overflow: "hidden"
      }}>
        
        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Customer Detail</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Transaction Amount</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Fulfillment Status</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Logged At</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#94A3B8" }}>No order records discovered.</td></tr>
                ) : (
                  orders.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontWeight: "700", color: "#1E293B", fontSize: "14px" }}>{o.customerName}</div>
                        <a href={`mailto:${o.email}`} style={{ fontSize: "12px", color: "#64748B", textDecoration: "none" }}>{o.email}</a>
                      </td>
                      <td style={{ padding: "18px 24px", fontWeight: "800", color: "#0F172A", fontSize: "14px" }}>
                        {o.currency} {Number(o.total).toLocaleString()}
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        {renderStatusBadge(o.status)}
                      </td>
                      <td style={{ padding: "18px 24px", color: "#64748B", fontSize: "13px" }} suppressHydrationWarning={true}>
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Proforma Tab */}
        {activeTab === "proformas" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Institution & Attn</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Contact Detail</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Verification</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {proformas.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#94A3B8" }}>No proforma queries issued yet.</td></tr>
                ) : (
                  proformas.map((q, i) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontWeight: "700", color: "#1E293B", fontSize: "14px" }}>{q.organization}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>Ref: {q.id}</div>
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>{q.contactName}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{q.email} | {q.phone}</div>
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        {renderStatusBadge(q.status)}
                      </td>
                      <td style={{ padding: "18px 24px", color: "#64748B", fontSize: "13px" }} suppressHydrationWarning={true}>
                        {new Date(q.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Agency Queries Tab */}
        {activeTab === "agencies" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Agency Name</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Contact & Territory</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Domain Target</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Brief Pitch</th>
                </tr>
              </thead>
              <tbody>
                {agencies.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#94A3B8" }}>No institution leads found.</td></tr>
                ) : (
                  agencies.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontWeight: "700", color: "#1E293B", fontSize: "14px" }}>{a.agencyName}</div>
                        {a.website && <a href={a.website} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#2563EB", textDecoration: "none" }}>🌐 Website Link</a>}
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{a.contactPerson} ({a.country})</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{a.email} | {a.phone}</div>
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                          {a.specialization}
                        </span>
                      </td>
                      <td style={{ padding: "18px 24px", color: "#475569", fontSize: "13px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.message || ""}>
                        {a.message || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Contacts Support Tab */}
        {activeTab === "contacts" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Sender</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Subject Head</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Communication Feed</th>
                  <th style={{ padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#94A3B8" }}>No general queries queued.</td></tr>
                ) : (
                  contacts.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "transparent" : "#FCFDFE" }}>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontWeight: "700", color: "#1E293B", fontSize: "14px" }}>{c.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>{c.email}</div>
                      </td>
                      <td style={{ padding: "18px 24px", fontWeight: "600", color: "#334155", fontSize: "13px" }}>
                        {c.subject}
                      </td>
                      <td style={{ padding: "18px 24px", color: "#64748B", fontSize: "13px", maxWidth: "300px", whiteSpace: "normal" }}>
                        {c.message}
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        {renderStatusBadge(c.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
