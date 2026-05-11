"use client";

import { useState } from "react";
import Link from "next/link";

export default function UserActivityTabs({ proformas, contacts, agencies }: any) {
  const [activeTab, setActiveTab] = useState("proforma");

  const tabStyle = (isActive: boolean) => ({
    padding: "12px 24px",
    background: "none",
    border: "none",
    borderBottom: isActive ? "3px solid #3B82F6" : "3px solid transparent",
    cursor: "pointer",
    fontWeight: isActive ? "700" : "500",
    color: isActive ? "#1E293B" : "#64748B",
    fontSize: "15px",
    transition: "all 0.2s ease"
  });

  return (
    <div className="user-activity-container" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <div className="tabs-header" style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
        <button onClick={() => setActiveTab("proforma")} style={tabStyle(activeTab === "proforma")}>Proforma Quotes <span style={{ background: "#E2E8F0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", marginLeft: "6px" }}>{proformas.length}</span></button>
        <button onClick={() => setActiveTab("contact")} style={tabStyle(activeTab === "contact")}>Contact Queries <span style={{ background: "#E2E8F0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", marginLeft: "6px" }}>{contacts.length}</span></button>
        <button onClick={() => setActiveTab("agency")} style={tabStyle(activeTab === "agency")}>Agency Queries <span style={{ background: "#E2E8F0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", marginLeft: "6px" }}>{agencies.length}</span></button>
      </div>

      <div className="tab-content" style={{ padding: "24px" }}>
        {activeTab === "proforma" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F1F5F9" }}>
                <tr>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Organization</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Items</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Created</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {proformas.length === 0 ? <tr><td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>No proforma quotes created yet.</td></tr> : proformas.map((p: any) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1E293B" }}>{p.organization}</td>
                    <td style={{ padding: "12px 16px" }}><span style={{ padding: "4px 10px", background: p.status === "SUBMITTED" ? "#DCFCE7" : "#F1F5F9", color: p.status === "SUBMITTED" ? "#166534" : "#475569", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>{p.status}</span></td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{p.items?.length || 0} journals</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "12px 16px" }}><Link href={`/account/proforma/${p.id}`} style={{ padding: "8px 14px", background: "#3B82F6", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "inline-block", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#2563EB"} onMouseOut={e => e.currentTarget.style.background = "#3B82F6"}>View & Download</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F1F5F9" }}>
                <tr>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Subject</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Message</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? <tr><td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>No contact queries found.</td></tr> : contacts.map((c: any) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1E293B" }}>{c.subject}</td>
                    <td style={{ padding: "12px 16px", color: "#475569", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.message}</td>
                    <td style={{ padding: "12px 16px" }}><span style={{ padding: "4px 10px", background: "#F1F5F9", color: "#475569", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>{c.status}</span></td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "agency" && (
          <div className="admin-table-wrap" style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#F1F5F9" }}>
                <tr>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Agency Name</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Specialization</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Message</th>
                  <th style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {agencies.length === 0 ? <tr><td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>No agency queries found.</td></tr> : agencies.map((a: any) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1E293B" }}>{a.agencyName}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{a.specialization}</td>
                    <td style={{ padding: "12px 16px", color: "#475569", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.message || "-"}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{new Date(a.createdAt).toLocaleDateString()}</td>
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
