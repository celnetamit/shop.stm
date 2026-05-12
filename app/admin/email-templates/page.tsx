"use client";

import { useEffect, useState } from "react";

type EmailTemplate = {
  id: string;
  key: string;
  subject: string;
  body: string;
  description: string | null;
};

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      const j = await res.json();
      if (j.ok) setTemplates(j.templates);
      else setError(j.error || "Fetch failure");
    } catch (err) {
      setError("Network fail");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, subject: selected.subject, body: selected.body })
      });
      const j = await res.json();
      if (j.ok) {
        alert("Template saved successfully!");
        await load();
        setSelected(null);
      } else {
        alert(j.error || "Save failure");
      }
    } catch (e) {
      alert("Network save error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Outfit, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0 }}>Communication Templates</h1>
            <p style={{ color: "#64748B", fontSize: "14px", marginTop: "4px" }}>Customize dynamic subject lines and HTML notification dispatch bodies.</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm("DANGER: This wipes dynamic database definitions and overrides them with pure application source code. Continue?")) return;
              try {
                const r = await fetch("/api/admin/email-templates/sync", { method: "POST" });
                const resJson = await r.json();
                if (resJson.ok) {
                  alert("✅ Successfully synchronized codebase to production database.");
                  await load();
                } else {
                  alert("Failed to sync: " + resJson.error);
                }
              } catch (e) {
                alert("Sync request errored out.");
              }
            }}
            style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            🔄 Force Reload from Codebase
          </button>
        </div>

        {error && <div style={{ padding: "12px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "#991B1B", marginBottom: "20px" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.5fr" : "1fr", gap: "24px", transition: "0.3s all" }}>
          
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0", background: "#FAFAFA", fontWeight: "600" }}>Notification Registry</div>
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {loading ? <div style={{ padding: "20px", textAlign: "center", color: "#64748B" }}>Syncing indices...</div> : null}
              {!loading && templates.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#64748B" }}>Zero templates recognized. Trigger an event to seed defaults automatically.</div>}
              
              {templates.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setSelected({ ...t })}
                  style={{ 
                    padding: "16px 20px", 
                    borderBottom: "1px solid #F1F5F9", 
                    cursor: "pointer",
                    background: selected?.id === t.id ? "#EFF6FF" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  <div style={{ fontWeight: "700", fontSize: "14px", color: selected?.id === t.id ? "#1D4ED8" : "#0F172A" }}>{t.key}</div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>{t.description || "System notification"}</div>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", position: "sticky", top: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Configure {selected.key}</h2>
                  <span style={{ fontSize: "12px", color: "#94A3B8", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", marginTop: "4px", display: "inline-block" }}>ID: {selected.id}</span>
                </div>
                <button onClick={() => setSelected(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "24px", color: "#94A3B8" }}>&times;</button>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", marginBottom: "8px", color: "#334155" }}>Envelope Subject Line</label>
                <input 
                  type="text" 
                  value={selected.subject} 
                  onChange={(e) => setSelected({...selected, subject: e.target.value})}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }} 
                  placeholder="Insert dynamic subject here..."
                />
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Pro-tip: Embed dynamic strings like <code>{"{{name}}"}</code> or <code>{"{{orderId}}"}</code>.</div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", marginBottom: "8px", color: "#334155" }}>HTML Ecosystem Core (Body)</label>
                <textarea 
                  value={selected.body} 
                  onChange={(e) => setSelected({...selected, body: e.target.value})}
                  style={{ width: "100%", minHeight: "300px", padding: "16px", borderRadius: "8px", border: "1px solid #CBD5E1", fontFamily: "monospace", fontSize: "13px", lineHeight: "1.6", background: "#F8FAFC" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={() => void handleSave()} 
                  disabled={saving}
                  style={{ flex: 1, background: "#2563EB", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }}
                >
                  {saving ? "Synchronizing..." : "Persist Changes"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
