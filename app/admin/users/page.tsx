"use client";

import { useEffect, useState } from "react";

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

const ACCESS_KEYS = [
  "canViewDashboard",
  "canManageUsers",
  "canManageOrders",
  "canManageProforma",
  "canManageCoupons",
  "canManageJournals",
  "canManageEmailTemplates",
  "canManageChats"
];

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

  async function updateUser(user: User) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: user.role, accessPermissions: user.accessPermissions || {} })
    });
    await load();
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Registered Users</h1>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>User</th>
            <th style={{ textAlign: "left" }}>Role</th>
            <th style={{ textAlign: "left" }}>Access (Edit User Access)</th>
            <th style={{ textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>
                <div>{r.name || "Unnamed"}</div>
                <div>{r.email}</div>
              </td>
              <td>
                <select
                  value={r.role}
                  onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, role: e.target.value as UserRole } : x))}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="LIBRARIAN">LIBRARIAN</option>
                  <option value="AGENCY">AGENCY</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="SCHOLAR">SCHOLAR</option>
                </select>
              </td>
              <td>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "6px" }}>
                  {ACCESS_KEYS.map((k) => (
                    <label key={k} style={{ fontSize: "12px" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(r.accessPermissions?.[k])}
                        onChange={(e) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, accessPermissions: { ...(x.accessPermissions || {}), [k]: e.target.checked } } : x))}
                      /> {k}
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <button onClick={() => void updateUser(r)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
