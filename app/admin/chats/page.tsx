"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  intent: string | null;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: "USER" | "BOT";
    content: string;
    createdAt: string;
  }>;
};

function deriveDisplayName(row: Pick<Row, "name" | "email">): string {
  if (row.name?.trim()) return row.name.trim();
  if (!row.email) return "Unknown User";

  const local = row.email.split("@")[0] || "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Unknown User";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseBot(content: string): { text: string; links: Array<{ label: string; href: string }>; steps: string[] } {
  try {
    const j = JSON.parse(content) as { text?: string; links?: Array<{ label: string; href: string }>; steps?: string[] };
    return { text: j.text || content, links: j.links || [], steps: j.steps || [] };
  } catch {
    return { text: content, links: [], steps: [] };
  }
}

export default function AdminChatsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Row | null>(null);
  const [q, setQ] = useState("");
  const [intentFilter, setIntentFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetch("/api/admin/chats", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok: boolean; rows?: Row[] }) => setRows(j.ok ? j.rows || [] : []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => [...rows].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), [rows]);

  const intents = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) s.add((r.intent || "Inquiry").trim());
    return ["ALL", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return sorted.filter((r) => {
      if (intentFilter !== "ALL" && (r.intent || "Inquiry") !== intentFilter) return false;
      const t = new Date(r.updatedAt).getTime();
      if (fromMs && t < fromMs) return false;
      if (toMs && t > toMs) return false;
      if (!needle) return true;
      const text = `${r.name || ""} ${r.email || ""} ${r.intent || ""}`.toLowerCase();
      return text.includes(needle);
    });
  }, [sorted, q, intentFilter, fromDate, toDate]);

  return (
    <section className="admin-page" style={{ maxWidth: "1250px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "16px" }}>Chat Leads</h1>
      {loading ? <p>Loading chats...</p> : null}
      {!loading && sorted.length === 0 ? <p>No chats found.</p> : null}

      {!loading && sorted.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, intent..."
              style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "9px 10px", fontSize: "13px" }}
            />
            <select value={intentFilter} onChange={(e) => setIntentFilter(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "9px 10px", fontSize: "13px", background: "#fff" }}>
              {intents.map((it) => (
                <option key={it} value={it}>{it === "ALL" ? "All Intents" : it}</option>
              ))}
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "9px 10px", fontSize: "13px" }}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "9px 10px", fontSize: "13px" }}
            />
          </div>
          <div style={{ marginBottom: "10px", fontSize: "12px", color: "#64748b" }}>
            Showing {filtered.length} of {sorted.length} leads
          </div>

        <div className="admin-table-wrap" style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "980px" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Intent</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Phone</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Organization</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Last Chat Time</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} style={{ borderTop: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#fff" : "#fcfdff" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{deriveDisplayName(row)}</td>
                  <td style={{ padding: "12px", color: "#334155" }}>{row.email || "N/A"}</td>
                  <td style={{ padding: "12px", color: "#334155" }}>{row.intent || "Inquiry"}</td>
                  <td style={{ padding: "12px", color: "#334155" }}>{row.phone || "N/A"}</td>
                  <td style={{ padding: "12px", color: "#334155" }}>{row.organization || "N/A"}</td>
                  <td style={{ padding: "12px", color: "#334155" }}>{new Date(row.updatedAt).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => setActive(row)}
                      title="View full chat"
                      style={{
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontWeight: 700
                      }}
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No results for selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        </>
      ) : null}

      {active ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(5px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setActive(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(980px, 100%)",
              maxHeight: "88vh",
              background: "#fff",
              border: "1px solid #dbe3f1",
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{deriveDisplayName(active)}</strong>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {active.email || "N/A"} | {active.phone || "N/A"} | Intent: {active.intent || "Inquiry"}
                </div>
              </div>
              <button type="button" onClick={() => setActive(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>

            <div style={{ padding: "12px", overflowY: "auto", background: "#f8fbff", minHeight: "380px" }}>
              {active.messages.map((m) => {
                const bot = m.sender === "BOT" ? parseBot(m.content) : null;
                return (
                  <div key={m.id} style={{ marginBottom: "10px", display: "flex", justifyContent: m.sender === "USER" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "84%", background: m.sender === "USER" ? "#1d4ed8" : "#fff", color: m.sender === "USER" ? "#fff" : "#1e293b", border: m.sender === "USER" ? "none" : "1px solid #dbe3f1", borderRadius: "10px", padding: "9px 10px", fontSize: "12px" }}>
                      <div>{bot ? bot.text : m.content}</div>
                      {bot?.steps?.length ? (
                        <ol style={{ margin: "8px 0 0 16px", padding: 0 }}>
                          {bot.steps.map((s, idx) => (
                            <li key={`${m.id}-step-${idx}`} style={{ marginBottom: "4px" }}>{s}</li>
                          ))}
                        </ol>
                      ) : null}
                      {bot?.links?.length ? (
                        <div style={{ marginTop: "6px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {bot.links.map((l) => (
                            <a key={`${m.id}-${l.href}`} href={l.href} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none", fontSize: "11px" }}>
                              {l.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <div style={{ fontSize: "10px", marginTop: "5px", opacity: 0.7 }}>
                        {new Date(m.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
