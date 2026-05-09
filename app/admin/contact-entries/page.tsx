"use client";

import { useEffect, useState } from "react";

type ContactEntry = { id: string; name: string; email: string; subject: string; message: string; status: "NEW" | "IN_PROGRESS" | "RESOLVED"; createdAt: string };

export default function AdminContactEntriesPage() {
  const [rows, setRows] = useState<ContactEntry[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/contact-entries", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; contactEntries?: ContactEntry[]; error?: string; warning?: string };
    if (!json.ok) return setError(json.error || "Failed to load contact entries");
    setError(json.warning || "");
    setRows(json.contactEntries || []);
  }

  useEffect(() => { void load(); }, []);

  async function updateStatus(id: string, status: ContactEntry["status"]) {
    await fetch(`/api/admin/contact-entries/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <section className="admin-page">
      <h1>Contact Us Entries</h1>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td><td>{r.email}</td><td>{r.subject}</td><td>{r.message}</td>
                <td><select value={r.status} onChange={(e) => void updateStatus(r.id, e.target.value as ContactEntry["status"])}><option value="NEW">NEW</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="RESOLVED">RESOLVED</option></select></td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
