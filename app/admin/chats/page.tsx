"use client";

import { useEffect, useState } from "react";

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

function parseBot(content: string): { text: string; links: Array<{ label: string; href: string }> } {
  try {
    const j = JSON.parse(content) as { text?: string; links?: Array<{ label: string; href: string }> };
    return { text: j.text || content, links: j.links || [] };
  } catch {
    return { text: content, links: [] };
  }
}

export default function AdminChatsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/chats", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok: boolean; rows?: Row[] }) => setRows(j.ok ? j.rows || [] : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-page" style={{ maxWidth: "1250px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "16px" }}>Chat Leads</h1>
      {loading ? <p>Loading chats...</p> : null}
      {!loading && rows.length === 0 ? <p>No chats found.</p> : null}

      <div style={{ display: "grid", gap: "14px" }}>
        {rows.map((row) => (
          <article key={row.id} style={{ border: "1px solid #dbe3f1", borderRadius: "12px", background: "#fff", padding: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "10px" }}>
              <div>
                <strong>{row.name || "Unknown User"}</strong>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  {row.email || "No email"} {row.phone ? `| ${row.phone}` : ""} {row.organization ? `| ${row.organization}` : ""}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Intent: {row.intent || "N/A"}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
                Last chat: {new Date(row.updatedAt).toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", maxHeight: "320px", overflowY: "auto", background: "#f8fbff" }}>
              {row.messages.map((m) => {
                const bot = m.sender === "BOT" ? parseBot(m.content) : null;
                return (
                  <div key={m.id} style={{ marginBottom: "10px", display: "flex", justifyContent: m.sender === "USER" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "82%", background: m.sender === "USER" ? "#1d4ed8" : "#fff", color: m.sender === "USER" ? "#fff" : "#1e293b", border: m.sender === "USER" ? "none" : "1px solid #dbe3f1", borderRadius: "10px", padding: "8px 10px", fontSize: "12px" }}>
                      <div>{bot ? bot.text : m.content}</div>
                      {bot?.links?.length ? (
                        <div style={{ marginTop: "6px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {bot.links.map((l) => (
                            <a key={`${m.id}-${l.href}`} href={l.href} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 700, fontSize: "11px", textDecoration: "none" }}>
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
          </article>
        ))}
      </div>
    </section>
  );
}
