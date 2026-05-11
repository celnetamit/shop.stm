"use client";

import { useEffect, useState } from "react";

type User = { id: string; name: string | null; email: string; role: "USER" | "ADMIN"; createdAt: string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; users?: User[]; error?: string };
    if (!json.ok) return setError(json.error || "Failed to load users");
    setRows(json.users || []);
  }

  useEffect(() => { void load(); }, []);

  async function updateRole(id: string, role: User["role"]) {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role }) });
    await load();
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Outfit, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Registered Users</h1>
            <p style={{ color: "#64748B", fontSize: "14px", marginTop: "4px" }}>Manage account permissions and view unique platform members.</p>
          </div>
          <div style={{ background: "white", padding: "8px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#0F172A", fontSize: "14px", fontWeight: "600" }}>
            Total: {rows.length}
          </div>
        </div>

        {error && (
          <div style={{ padding: "16px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#B91C1C", marginBottom: "24px" }}>
            {error}
          </div>
        )}

        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>User Details</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role Authorization</th>
                  <th style={{ padding: "16px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#FAFAFA"} onMouseOut={e => e.currentTarget.style.background = "white"}>
                    <td style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", background: r.role === "ADMIN" ? "#EEF2FF" : "#F1F5F9", color: r.role === "ADMIN" ? "#4F46E5" : "#64748B", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                          {r.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1E293B", fontSize: "15px" }}>{r.name || "Unnamed User"}</div>
                          <div style={{ color: "#64748B", fontSize: "13px" }}>{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <select 
                          value={r.role} 
                          onChange={(e) => void updateRole(r.id, e.target.value as User["role"])}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "700",
                            background: r.role === "ADMIN" ? "#ECFDF5" : "#F3F4F6",
                            color: r.role === "ADMIN" ? "#059669" : "#4B5563",
                            border: "1px solid transparent",
                            cursor: "pointer",
                            outline: "none",
                            appearance: "none",
                            paddingRight: "32px"
                          }}
                        >
                          <option value="USER">👤 USER</option>
                          <option value="ADMIN">🛡️ ADMIN</option>
                        </select>
                        <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "10px" }}>▼</div>
                      </div>
                    </td>
                    <td style={{ padding: "20px 24px", color: "#64748B", fontSize: "14px" }}>
                      {new Date(r.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "48px", textAlign: "center", color: "#94A3B8", fontSize: "15px" }}>
                      No registered users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
