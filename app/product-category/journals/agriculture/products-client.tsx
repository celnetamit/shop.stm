"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/components/cart-store";
import { fetchPrefillUser, loadDraft, saveDraft } from "@/lib/client/form-prefill";
import {
  buildJournalCartItemId,
  getCurrentSubscriptionYears,
  getIssueCountFromFrequency,
  getIssueLabels,
  getIssueWiseUnitPrice
} from "@/lib/journal-cart";

type Journal = {
  id: string;
  slug: string;
  journalName: string;
  subject: string;
  issn: string | null;
  frequency: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  imageUrl: string | null;
  aboutJournal: string | null;
  focusAndScope: string | null;
};

export default function AgricultureCatalogClient({ journals }: { journals: Journal[] }) {
  const { addItem, items, removeItem, setQty } = useCart();
  const [query, setQuery] = useState("");
  const [planById, setPlanById] = useState<Record<string, "PRINT" | "ONLINE" | "PRINT_ONLINE">>({});
  const [rowConfigById, setRowConfigById] = useState<Record<string, { year: string; issue: string }>>({});
  const years = getCurrentSubscriptionYears();

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const subjectName = useMemo(() => {
    if (journals && journals.length > 0) {
      return journals[0].subject;
    }
    return "Journals";
  }, [journals]);

  useEffect(() => {
    if (subjectName) {
      setSubject(`Query regarding ${subjectName} Journals`);
    }
  }, [subjectName]);

  useEffect(() => {
    const draft = loadDraft<{ name: string; email: string; phone: string; subject: string; message: string }>("draft:category-query");
    if (draft.name) setName(draft.name);
    if (draft.email) setEmail(draft.email);
    if (draft.phone) setPhone(draft.phone);
    if (draft.subject) setSubject(draft.subject);
    if (draft.message) setMessage(draft.message);
    (async () => {
      const u = await fetchPrefillUser();
      if (!u) return;
      if (!draft.name && u.name) setName(u.name);
      if (!draft.email && u.email) setEmail(u.email);
    })();
  }, []);

  useEffect(() => {
    saveDraft("draft:category-query", { name, email, phone, subject, message });
  }, [name, email, phone, subject, message]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return journals;
    return journals.filter((j) => `${j.journalName} ${j.subject} ${j.issn || ""}`.toLowerCase().includes(q));
  }, [journals, query]);

  const getPrice = (j: Journal, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE") =>
    plan === "ONLINE" ? j.onlineInr : plan === "PRINT_ONLINE" ? j.combinedInr : j.printInr;

  function getRowConfig(id: string) {
    return rowConfigById[id] || { year: String(years[0]), issue: "All(Jan-Dec)" };
  }

  async function submitQuery(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact-entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message })
      });

      const json = (await res.json()) as { ok: boolean; error?: string };
      setLoading(false);
      
      if (!json.ok) {
        setStatus(json.error || "Failed to submit enquiry. Please try again.");
        return;
      }

      setMessage("");
      setStatus("Thank you! Your enquiry was submitted successfully.");
    } catch (err) {
      setLoading(false);
      setStatus("A connection error occurred. Please try again.");
    }
  }

  return (
    <main className="agri-page">
      <section className="agri-hero">
        <div>
          <div className="agri-breadcrumb" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", fontSize: "14px", color: "#94A3B8", marginBottom: "16px" }}>
            <Link href="/" style={{ textDecoration: "none", color: "#cbd5e1" }}>Home</Link>
            <span>/</span>
            <Link href="/" style={{ textDecoration: "none", color: "#cbd5e1" }}>Shop</Link>
            <span>/</span>
            <Link href="/product-category/journals" style={{ textDecoration: "none", color: "#cbd5e1" }}>Journals</Link>
            <span>/</span>
            <span style={{ color: "#60a5fa", fontWeight: "600" }}>{subjectName}</span>
          </div>
          <h1>{subjectName} Journals</h1>
          <p>Modern catalog UI with annual pricing details.</p>
        </div>
        <div className="agri-hero-actions">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search journal, ISSN..." />
          <Link href="/cart" className="agri-cart-link">Go to Cart</Link>
        </div>
      </section>

      <section className="agri-grid">
        {filtered.map((j) => {
          const plan = planById[j.id] || "PRINT";
          const rowConfig = getRowConfig(j.id);
          const totalIssues = getIssueCountFromFrequency(j.frequency);
          const issueLabels = getIssueLabels(totalIssues);
          const price = getIssueWiseUnitPrice(getPrice(j, plan), totalIssues, rowConfig.issue);
          const cartItemId = buildJournalCartItemId(j.id, plan, rowConfig.year, rowConfig.issue);
          const qty = items.filter((it) => it.id === cartItemId).reduce((sum, it) => sum + it.qty, 0);

          const isBook =
            j.subject.toLowerCase().includes("book") ||
            j.subject.toLowerCase().includes("monograph") ||
            j.subject.toLowerCase().includes("nstc") ||
            j.journalName.toLowerCase().includes("book") ||
            j.journalName.toLowerCase().includes("monograph") ||
            j.journalName.toLowerCase().includes("handbook") ||
            j.journalName.toLowerCase().includes("textbook");
          const cardHsn = plan === "ONLINE" ? "998431" : isBook ? "4901" : "4902";

          return (
            <article className="agri-card" key={j.id}>
              <Link href={`/product/${j.slug}`}>
                <img src={j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal"} alt={j.journalName} />
              </Link>
              <div className="agri-card-body">
                <h3><Link href={`/product/${j.slug}`}>{j.journalName}</Link></h3>
                <p style={{ minHeight: "44px" }}>
                  {j.subject} {j.issn ? `| ISSN ${j.issn}` : ""}
                  <span style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    HSN/SAC: {cardHsn}
                  </span>
                </p>
                <div className="agri-controls">
                  <select
                    value={plan}
                    onChange={(e) => setPlanById((prev) => ({ ...prev, [j.id]: e.target.value as "PRINT" | "ONLINE" | "PRINT_ONLINE" }))}
                  >
                    <option value="PRINT">Print</option>
                    <option value="ONLINE">Online</option>
                    <option value="PRINT_ONLINE">Print + Online</option>
                  </select>
                  <select
                    value={rowConfig.year}
                    onChange={(e) => setRowConfigById((prev) => ({ ...prev, [j.id]: { ...rowConfig, year: e.target.value } }))}
                  >
                    {years.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rowConfig.issue}
                    onChange={(e) => setRowConfigById((prev) => ({ ...prev, [j.id]: { ...rowConfig, issue: e.target.value } }))}
                  >
                    <option value="All(Jan-Dec)">All issues</option>
                    {issueLabels.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="agri-price">₹{price.toLocaleString("en-IN")}</span>
                </div>
                {qty > 0 ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button type="button" onClick={() => setQty(cartItemId, qty - 1)} className="agri-cart-mini">-</button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: cartItemId,
                          journalName: `${j.journalName}${rowConfig.issue === "All(Jan-Dec)" ? "" : ` (${rowConfig.issue})`}`,
                          subject: j.subject,
                          issn: j.issn,
                          image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                          year: rowConfig.year,
                          issue: rowConfig.issue,
                          plan,
                          unitPrice: price
                        })
                      }
                    >
                      In Cart: {qty}
                    </button>
                    <button type="button" onClick={() => removeItem(cartItemId)} className="agri-cart-mini">Remove</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      addItem({
                        id: cartItemId,
                        journalName: `${j.journalName}${rowConfig.issue === "All(Jan-Dec)" ? "" : ` (${rowConfig.issue})`}`,
                        subject: j.subject,
                        issn: j.issn,
                        image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                        year: rowConfig.year,
                        issue: rowConfig.issue,
                        plan,
                        unitPrice: price
                      })
                    }
                  >
                    Add to Cart
                  </button>
                )}
                {qty > 0 ? <div className="agri-qty-badge">{qty}</div> : null}
              </div>
            </article>
          );
        })}
      </section>

      {/* 5. Any Queries Contact Form Section */}
      <section className="queries-section" style={{
        marginTop: "60px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "16px",
        padding: "48px 32px",
        boxShadow: "var(--shadow-md)",
        transition: "all 0.3s ease"
      }}>
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 40px" }}>
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
            marginBottom: "12px"
          }}>
            Support Desk
          </span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px",
            color: "var(--text)",
            fontWeight: "800",
            margin: "0 0 10px 0",
            letterSpacing: "-0.01em"
          }}>
            Any Queries?
          </h2>
          <p style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "15px",
            color: "var(--muted)",
            lineHeight: "1.6",
            margin: 0
          }}>
            Have questions about journal pricing, subscription durations, institutional access rights, or customized order proformas? Get in touch with our representative team.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "40px",
          alignItems: "stretch"
        }}>
          {/* Info Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)",
            border: "1px solid var(--line)",
            borderRadius: "14px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "var(--shadow-sm)"
          }}>
            <div>
              <h3 style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "20px",
                fontWeight: "700",
                color: "var(--text)",
                margin: "0 0 12px 0"
              }}>
                Talk to our Representatives
              </h3>
              <p style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "14px",
                color: "var(--muted)",
                lineHeight: "1.6",
                margin: "0 0 28px 0"
              }}>
                Our team provides specialized support services for academic libraries, institutions, and distributors worldwide.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(37, 99, 235, 0.08)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--brand)",
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Email Subscription Desk</h4>
                    <a href="mailto:subscriptions@stmjournals.com" style={{ textDecoration: "none", color: "var(--brand)", fontSize: "14px", fontFamily: "Outfit, sans-serif", fontWeight: "500" }}>subscriptions@stmjournals.com</a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.08)",
                    display: "grid",
                    placeItems: "center",
                    color: "#10b981",
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Call Support Lines</h4>
                    <span style={{ color: "var(--muted)", fontSize: "14px", fontFamily: "Outfit, sans-serif", fontWeight: "500" }}>(+91)-0120-4781-200</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(139, 92, 246, 0.08)",
                    display: "grid",
                    placeItems: "center",
                    color: "#8b5cf6",
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Registered Head Office</h4>
                    <span style={{ color: "var(--muted)", fontSize: "13.5px", fontFamily: "Outfit, sans-serif", lineHeight: "1.4" }}>
                      Consortium eLearning Network Pvt. Ltd.<br />
                      A-118, Sector-63, Noida, U.P. India
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: "32px",
              paddingTop: "20px",
              borderTop: "1px dashed var(--line)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
              <span style={{ color: "#10b981", fontSize: "13px", fontWeight: "600", fontFamily: "Outfit, sans-serif" }}>Average response time: &lt; 2 hours</span>
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "14px",
            padding: "32px",
            boxShadow: "var(--shadow-sm)"
          }}>
            <form onSubmit={submitQuery} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="query-name" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Outfit, sans-serif" }}>Full Name *</label>
                  <input
                    id="query-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-soft)",
                      color: "var(--text)",
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "14.5px",
                      outline: "none",
                      transition: "all 0.2s"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="query-email" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Outfit, sans-serif" }}>Email Address *</label>
                  <input
                    id="query-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-soft)",
                      color: "var(--text)",
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "14.5px",
                      outline: "none",
                      transition: "all 0.2s"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="query-phone" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Outfit, sans-serif" }}>Phone Number</label>
                  <input
                    id="query-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number (optional)"
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-soft)",
                      color: "var(--text)",
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "14.5px",
                      outline: "none",
                      transition: "all 0.2s"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="query-subject" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Outfit, sans-serif" }}>Subject *</label>
                  <input
                    id="query-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g., Subscription discount"
                    required
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface-soft)",
                      color: "var(--text)",
                      fontFamily: "Outfit, sans-serif",
                      fontSize: "14.5px",
                      outline: "none",
                      transition: "all 0.2s"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="query-message" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Outfit, sans-serif" }}>Message *</label>
                <textarea
                  id="query-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  required
                  rows={4}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-soft)",
                    color: "var(--text)",
                    fontFamily: "Outfit, sans-serif",
                    fontSize: "14.5px",
                    outline: "none",
                    transition: "all 0.2s",
                    resize: "vertical",
                    minHeight: "100px"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, var(--brand) 0%, #1d4ed8 100%)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "14px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.2s ease-in-out"
                }}
              >
                {loading ? "Sending Enquiry..." : "Send Message"}
              </button>

              {status ? (
                <div style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: status.includes("successfully") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${status.includes("successfully") ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                  color: status.includes("successfully") ? "#047857" : "#b91c1c",
                  fontSize: "13.5px",
                  fontWeight: "500",
                  fontFamily: "Outfit, sans-serif",
                  textAlign: "center"
                }}>
                  {status}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
