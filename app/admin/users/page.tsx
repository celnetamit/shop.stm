"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type UserRole = "USER" | "ADMIN" | "MANAGER" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR";
type AccessPermissions = Record<string, boolean>;

type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
  accessPermissions?: AccessPermissions | null;
};

const ACCESS_ITEMS: Array<{ key: string; label: string }> = [
  { key: "canViewDashboard", label: "View Dashboard" },
  { key: "canManageUsers", label: "Manage Users" },
  { key: "canManageOrders", label: "Manage Orders" },
  { key: "canManageProforma", label: "Manage Proforma" },
  { key: "canManageCoupons", label: "Manage Coupons" },
  { key: "canManageJournals", label: "Manage Journals" },
  { key: "canManageEmailTemplates", label: "Manage Email Templates" },
  { key: "canManageChats", label: "Manage Chats" }
];

export default function AdminUsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("USER");
  const [adding, setAdding] = useState(false);

  const totalAdmins = useMemo(() => rows.filter((r) => r.role === "ADMIN").length, [rows]);

  async function load() {
    setError("");
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; users?: User[]; error?: string };
    if (!json.ok) return setError(json.error || "Failed to load users");
    setRows(json.users || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateUser(user: User) {
    setSavingId(user.id);
    setError("");
    const password = (newPasswords[user.id] || "").trim();
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: user.role,
        accessPermissions: user.accessPermissions || {},
        password: password || undefined
      })
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setError(json.error || "Save failed");
      setSavingId(null);
      return;
    }
    setNewPasswords((prev) => ({ ...prev, [user.id]: "" }));
    await load();
    setSavingId(null);
  }

  async function createUser() {
    setAdding(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole, accessPermissions: {} })
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setError(json.error || "Failed to create user");
      setAdding(false);
      return;
    }
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("USER");
    await load();
    setAdding(false);
  }

  return (
    <div style={{ padding: "28px", background: "#f8fafc", minHeight: "100vh", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "30px", fontWeight: 800 }}>Users & Access Control</h1>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>Admin-only user management with role, rights and password controls.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px", fontSize: "13px" }}>Total Users: <strong>{rows.length}</strong></div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px", fontSize: "13px" }}>Admins: <strong>{totalAdmins}</strong></div>
          </div>
        </div>

        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginBottom: "18px" }}>
          <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>Add User (Admin)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.4fr 1fr 1fr auto", gap: "10px" }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" style={inputStyle} />
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password (min 8)" type="password" style={inputStyle} />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} style={inputStyle}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="LIBRARIAN">LIBRARIAN</option>
              <option value="AGENCY">AGENCY</option>
              <option value="STUDENT">STUDENT</option>
              <option value="SCHOLAR">SCHOLAR</option>
            </select>
            <button disabled={adding} onClick={() => void createUser()} style={primaryBtn}>{adding ? "Adding..." : "Add User"}</button>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "10px 0 0" }}>Welcome email is sent automatically to newly created users.</p>
        </section>

        {error ? <div style={{ marginBottom: "12px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fee2e2", padding: "10px 12px", borderRadius: "10px" }}>{error}</div> : null}

        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          {rows.map((r) => (
            <div key={r.id} style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.name || "Unnamed User"}</div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>{r.email}</div>
                </div>

                <select
                  value={r.role}
                  onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, role: e.target.value as UserRole } : x)))}
                  style={inputStyle}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="AGENCY">AGENCY</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="SCHOLAR">SCHOLAR</option>
                </select>

                <input
                  type="password"
                  value={newPasswords[r.id] || ""}
                  onChange={(e) => setNewPasswords((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="Set new password"
                  style={inputStyle}
                />

                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                  style={{ ...secondaryBtn, width: "100%" }}
                >
                  {expanded[r.id] ? "Hide Access Rights" : "Show Access Rights"}
                </button>

                <button disabled={savingId === r.id} onClick={() => void updateUser(r)} style={primaryBtn}>
                  {savingId === r.id ? "Saving..." : "Save"}
                </button>
              </div>

              {expanded[r.id] ? (
                <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
                    {ACCESS_ITEMS.map((item) => (
                      <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(r.accessPermissions?.[item.key])}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? {
                                      ...x,
                                      accessPermissions: {
                                        ...(x.accessPermissions || {}),
                                        [item.key]: e.target.checked
                                      }
                                    }
                                  : x
                              )
                            )
                          }
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {rows.length === 0 ? <div style={{ padding: "20px", color: "#64748b" }}>No users found.</div> : null}
        </section>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  width: "100%",
  background: "#fff",
  outline: "none"
};

const primaryBtn: CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer"
};

const secondaryBtn: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer"
};
