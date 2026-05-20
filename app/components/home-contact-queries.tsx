"use client";

import { useState } from "react";
import { useEffect } from "react";
import { fetchPrefillUser, loadDraft, saveDraft } from "@/lib/client/form-prefill";

export default function HomeContactQueries() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "Homepage Enquiry", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const draft = loadDraft<typeof formData>("draft:home-contact");
    if (Object.keys(draft).length) setFormData((prev) => ({ ...prev, ...draft }));
    (async () => {
      const u = await fetchPrefillUser();
      if (!u) return;
      setFormData((prev) => ({
        ...prev,
        name: prev.name || u.name || prev.name,
        email: prev.email || u.email || prev.email
      }));
    })();
  }, []);

  useEffect(() => {
    saveDraft("draft:home-contact", formData);
  }, [formData]);

  async function handleHomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: "error", text: "⚠️ Please fill out all required fields." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({ type: "success", text: "🎉 Thank you! Your query has been recorded. Our team will contact you shortly." });
        setFormData((prev) => ({ ...prev, message: "" }));
      } else {
        setStatus({ type: "error", text: data.error || "Enquiry submission failed." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-section-block" style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: "12px",
      padding: "40px 32px",
      boxShadow: "var(--shadow-md)",
      transition: "all 0.3s ease",
      marginTop: "50px",
      marginBottom: "20px"
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "start" }}>
        {/* Left Column: Address and Info */}
        <div>
          <span style={{
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--brand)",
            background: "var(--accent-glow)",
            padding: "6px 14px",
            borderRadius: "999px",
            display: "inline-block",
            marginBottom: "16px"
          }}>
            STM Support Desk
          </span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px",
            color: "var(--text)",
            fontWeight: "800",
            margin: "0 0 16px 0",
            letterSpacing: "-0.01em"
          }}>
            Any Queries ?
          </h2>
          <p style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "15px",
            color: "var(--muted)",
            lineHeight: "1.6",
            marginBottom: "30px"
          }}>
            Have questions about journal access, subscription rates, custom library quotes, or book publications? Reach out to us directly!
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Address */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--accent-glow)",
                borderRadius: "10px",
                padding: "10px",
                color: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)"
              }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Office Address</h4>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", lineHeight: "1.5", fontFamily: "Outfit, sans-serif" }}>
                  Consortium e-Learning Network Pvt. Ltd.<br />
                  A-118, 1st Floor, Sector-63,<br />
                  Noida, U.P. 201301, India
                </p>
              </div>
            </div>

            {/* Email */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--accent-glow)",
                borderRadius: "10px",
                padding: "10px",
                color: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)"
              }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Email Support</h4>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>
                  <a href="mailto:info@stmjournals.com" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: "600" }}>info@stmjournals.com</a>
                </p>
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                background: "var(--accent-glow)",
                borderRadius: "10px",
                padding: "10px",
                color: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-sm)"
              }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Call Center</h4>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>
                  +91-120-4781200 / +91-120-4781211
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div style={{
          background: "var(--surface-soft)",
          border: "1px solid var(--line)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <form onSubmit={handleHomeSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g. Dr. Amit Sharma"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="amit@univ.edu"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="E.g. +91 9876543210"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="General Subscription Enquiry"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Your Message *</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we assist you today? Please enter your queries..."
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            {status && (
              <div style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "600",
                background: status.type === "success" ? "rgba(22, 163, 74, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: status.type === "success" ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                color: status.type === "success" ? "#16a34a" : "#ef4444"
              }}>
                {status.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                fontWeight: "700",
                fontSize: "13.5px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.15)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--brand-dark)";
                  e.currentTarget.style.boxShadow = "0 4px 12px var(--accent-glow)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--brand)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(37, 99, 235, 0.15)";
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  Sending Enquiry...
                </>
              ) : "Send Your Enquiry"}
            </button>
          </form>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      </div>
    </div>
  );
}
