"use client";

import { useEffect, useState } from "react";

type AgencyQuery = {
  id: string;
  agencyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  website: string | null;
  specialization: string;
  message: string | null;
  createdAt: string;
};

export default function AdminAgencyQueriesPage() {
  const [rows, setRows] = useState<AgencyQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/agency-queries", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; queries?: AgencyQuery[]; error?: string };
      if (!json.ok) {
        setError(json.error || "Failed to load agency inquiries");
      } else {
        setRows(json.queries || []);
      }
    } catch (e) {
      setError("Network connectivity breakdown");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Outfit, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Agency Queries</h1>
            <p style={{ color: "#64748B", fontSize: "14px", marginTop: "4px" }}>Track incoming inquiries from distribution and academic partnership agencies.</p>
          </div>
          <div style={{ background: "white", padding: "8px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#0F172A", fontSize: "14px", fontWeight: "600" }}>
            Inquiries: {rows.length}
          </div>
        </div>

        {error && (
          <div style={{ padding: "16px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#B91C1C", marginBottom: "24px" }}>
            ⚠️ Error: {error}
          </div>
        )}

        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Agency / Contact</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Geography & Digital</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Specialization & Notes</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "15px" }}>Retrieving database records...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "15px" }}>No agency requests currently captured.</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#FAFAFA"} onMouseOut={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", background: "#DBEAFE", color: "#1E40AF", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px", textTransform: "uppercase" }}>
                            {(r.agencyName || "?")[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "15px" }}>{r.agencyName}</div>
                            <div style={{ color: "#64748B", fontSize: "13px", marginTop: "2px" }}>👤 {r.contactPerson}</div>
                            <div style={{ color: "#3B82F6", fontSize: "13px", fontWeight: "500", marginTop: "2px" }}>✉️ {r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "20px 24px" }}>
                        <div style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500" }}>🗺️ {r.country}</div>
                        <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>📞 {r.phone}</div>
                        {r.website && (
                          <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px", fontSize: "12px", background: "#EFF6FF", color: "#2563EB", textDecoration: "none", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>
                            🔗 {r.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                          </a>
                        )}
                      </td>
                      <td style={{ padding: "20px 24px", maxWidth: "350px" }}>
                        <span style={{ background: "#F1F5F9", color: "#475569", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: "600", display: "inline-block", marginBottom: "8px" }}>
                          {r.specialization}
                        </span>
                        {r.message && (
                          <p style={{ margin: 0, fontSize: "13px", color: "#64748B", lineHeight: "1.5", fontStyle: "italic" }}>
                            &quot;{r.message}&quot;
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "20px 24px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "14px", color: "#0F172A", fontWeight: "500" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                          {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
