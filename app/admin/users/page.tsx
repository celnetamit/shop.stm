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
    <section className="admin-page">
      <h1>Users</h1>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name || "-"}</td><td>{r.email}</td>
                <td><select value={r.role} onChange={(e) => void updateRole(r.id, e.target.value as User["role"])}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
