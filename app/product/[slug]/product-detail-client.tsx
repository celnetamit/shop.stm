"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/app/components/cart-store";
import { getIssueWiseUnitPrice } from "@/lib/journal-cart";

type FocusScopeItem = {
  title: string;
  contentHtml: string;
};

type Journal = {
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
  startedSince: string | null;
  abbreviation: string | null;
  focusScopeItems: FocusScopeItem[];
  indexing: string | null;
  indexingLogoImg: string | null;
  indexingLogoUrl: string | null;
  icvValue: string | null;
  icvUrl: string | null;
  impactFactor: string | null;
};

type Props = {
  journal: Journal;
  domains: string[];
  description: string;
  about: string;
  focus: string;
};

type Plan = "PRINT" | "ONLINE" | "PRINT_ONLINE";
type Tab = "DESCRIPTION" | "ABOUT" | "FOCUS" | "INDEXING";

export default function ProductDetailClient({ journal, domains, description, about, focus }: Props) {
  const { addItem, items } = useCart();
  const years = [2026, 2025, 2024];

  const [plan, setPlan] = useState<Plan>("ONLINE");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedIssue, setSelectedIssue] = useState<string>("All(Jan-Dec)");
  const [tab, setTab] = useState<Tab>("DESCRIPTION");

  const issueCount = useMemo(() => {
    if (!journal.frequency) return 2;
    const cleaned = journal.frequency.trim().toLowerCase();
    if (cleaned.includes("bi-annual") || cleaned.includes("biannual")) return 2;
    const match = cleaned.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 2;
  }, [journal.frequency]);

  const issueOptions = useMemo(() => {
    if (issueCount === 2) {
      return ["1(Jan-June)", "2(July-Dec)", "All(Jan-Dec)"];
    }
    if (issueCount === 3) {
      return ["1(Jan-Apr)", "2(May-Aug)", "3(Sep-Dec)", "All(Jan-Dec)"];
    }
    if (issueCount === 4) {
      return ["1(Jan-Mar)", "2(Apr-June)", "3(July-Sep)", "4(Oct-Dec)", "All(Jan-Dec)"];
    }
    if (issueCount === 6) {
      return ["1(Jan-Feb)", "2(Mar-Apr)", "3(May-June)", "4(July-Aug)", "5(Sep-Oct)", "6(Nov-Dec)", "All(Jan-Dec)"];
    }
    if (issueCount === 12) {
      return ["1(Jan)", "2(Feb)", "3(Mar)", "4(Apr)", "5(May)", "6(June)", "7(July)", "8(Aug)", "9(Sep)", "10(Oct)", "11(Nov)", "12(Dec)", "All(Jan-Dec)"];
    }
    return Array.from({ length: issueCount }, (_, i) => `Issue ${i + 1}`).concat("All(Jan-Dec)");
  }, [issueCount]);

  useEffect(() => {
    if (!issueOptions.includes(selectedIssue)) {
      setSelectedIssue("All(Jan-Dec)");
    }
  }, [issueOptions, selectedIssue]);

  const price = useMemo(() => {
    let base = journal.combinedInr;
    if (plan === "PRINT") base = journal.printInr;
    if (plan === "ONLINE") base = journal.onlineInr;
    
    if (selectedIssue !== "All(Jan-Dec)") {
      return getIssueWiseUnitPrice(base, issueCount, selectedIssue);
    }
    return base;
  }, [plan, journal, selectedIssue, issueCount]);

  const hsnCode = useMemo(() => {
    if (plan === "ONLINE") return "998431";
    const lowerName = (journal.journalName || "").toLowerCase();
    const lowerSubject = (journal.subject || "").toLowerCase();
    const isBook =
      lowerSubject.includes("book") ||
      lowerSubject.includes("monograph") ||
      lowerSubject.includes("nstc") ||
      lowerName.includes("book") ||
      lowerName.includes("monograph") ||
      lowerName.includes("handbook") ||
      lowerName.includes("textbook");
    return isBook ? "4901" : "4902";
  }, [plan, journal]);

  const selectedItemId = `${journal.slug}-${plan}-${selectedYear}-${selectedIssue}`;
  const selectedQty = items
    .filter((it) => it.id === selectedItemId)
    .reduce((sum, it) => sum + it.qty, 0);

  return (
    <main className="product-v2-page">
      <div className="product-breadcrumb" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "20px", fontSize: "14px", color: "#64748B" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#64748B" }}>Home</Link>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <Link href="/" style={{ textDecoration: "none", color: "#64748B" }}>Shop</Link>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <Link href="/product-category/journals" style={{ textDecoration: "none", color: "#64748B" }}>Journals</Link>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <Link href={`/product-category/journals/${encodeURIComponent(journal.subject.trim().toLowerCase())}`} style={{ textDecoration: "none", color: "#64748B" }}>{journal.subject}</Link>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <span style={{ color: "#2563EB", fontWeight: "600" }}>{journal.journalName}</span>
      </div>

      <div className="product-v2-layout">
        <aside className="product-v2-sidebar">
          <h3>All Domains</h3>
          <div className="product-v2-domain-list">
            {domains.map((d) => (
              <a key={d} href={`/product-category/journals/${encodeURIComponent(d)}`} className={d === journal.subject ? "active" : ""}>
                {d}
              </a>
            ))}
          </div>
        </aside>

        <section className="product-v2-main">
          <div className="product-v2-head">
            <img src={journal.imageUrl || "https://dummyimage.com/420x580/eaf0ff/17366f.png&text=STM+Journal"} alt={journal.journalName} />

            <div>
              <h1>{journal.journalName}</h1>
              <p className="product-v2-meta">
                {journal.issn ? `ISSN: ${journal.issn}` : "ISSN: N/A"}
                {journal.frequency ? ` • ${journal.frequency}` : ""}
                {` • HSN/SAC: ${hsnCode}`}
              </p>
              {journal.abbreviation && (
                <a 
                  href={`https://journals.stmjournals.com/editorial-board/${journal.abbreviation.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-board-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Editorial Board
                </a>
              )}

              <div className="product-v2-price-grid">
                <div 
                  className={plan === "PRINT" ? "active" : ""}
                  onClick={() => setPlan("PRINT")}
                  role="button"
                  tabIndex={0}
                >
                  <span>Print</span>
                  <strong>₹{journal.printInr.toLocaleString("en-IN")}</strong>
                </div>
                <div 
                  className={plan === "ONLINE" ? "active" : ""}
                  onClick={() => setPlan("ONLINE")}
                  role="button"
                  tabIndex={0}
                >
                  <span>Online</span>
                  <strong>₹{journal.onlineInr.toLocaleString("en-IN")}</strong>
                </div>
                <div 
                  className={plan === "PRINT_ONLINE" ? "active" : ""}
                  onClick={() => setPlan("PRINT_ONLINE")}
                  role="button"
                  tabIndex={0}
                >
                  <span>Print + Online</span>
                  <strong>₹{journal.combinedInr.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <div className="product-v2-controls">
                <div>
                  <label>Subscription Plan</label>
                  <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
                    <option value="PRINT">Print</option>
                    <option value="ONLINE">Online</option>
                    <option value="PRINT_ONLINE">Print + Online</option>
                  </select>
                </div>

                <div>
                  <label>Subscription Year</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label>Issue</label>
                  <select value={selectedIssue} onChange={(e) => setSelectedIssue(e.target.value)}>
                    {issueOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="product-v2-current-price" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                <span>Selected Price: ₹{price.toLocaleString("en-IN")}</span>
                <span className="product-v2-price-chip">
                  HSN/SAC: {hsnCode}
                </span>
              </div>
              <div className="product-v2-cart-actions">
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      id: selectedItemId,
                      journalName: `${journal.journalName} (${selectedIssue})`,
                      subject: journal.subject,
                      issn: journal.issn,
                      image: journal.imageUrl || "https://dummyimage.com/420x580/eaf0ff/17366f.png&text=STM+Journal",
                      year: selectedYear,
                      issue: selectedIssue,
                      plan,
                      unitPrice: price
                    })
                  }
                >
                  Add Selected Product to Cart
                </button>
                <span>In Cart: {selectedQty}</span>
                <Link href="/cart">Go to Cart</Link>
              </div>
            </div>
          </div>

          <div className="product-v2-tabs">
            <button className={tab === "DESCRIPTION" ? "active" : ""} onClick={() => setTab("DESCRIPTION")}>Description</button>
            <button className={tab === "ABOUT" ? "active" : ""} onClick={() => setTab("ABOUT")}>About Journal</button>
            <button className={tab === "FOCUS" ? "active" : ""} onClick={() => setTab("FOCUS")}>Focus & Scope</button>
            <button className={tab === "INDEXING" ? "active" : ""} onClick={() => setTab("INDEXING")}>Indexing</button>
          </div>

          <section className="product-v2-panel">
            {tab === "DESCRIPTION" ? (
              <div 
                className="product-v2-html-content"
                dangerouslySetInnerHTML={{ __html: journal.aboutJournal || description }}
              />
            ) : null}

            {tab === "ABOUT" ? (
              <div>
                <table className="product-v2-about-table">
                  <tbody>
                    <tr><th>Journal Name</th><td>{journal.journalName}</td></tr>
                    <tr><th>Domain</th><td>{journal.subject}</td></tr>
                    <tr><th>ISSN</th><td>{journal.issn || "N/A"}</td></tr>
                    <tr><th>Started Since</th><td>{journal.startedSince || "N/A"}</td></tr>
                    <tr><th>Frequency</th><td>{journal.frequency || "N/A"}</td></tr>
                    <tr><th>HSN/SAC Code</th><td style={{ fontWeight: "600", color: "var(--brand)" }}>{hsnCode} (Based on selected plan)</td></tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === "FOCUS" ? (
              journal.focusScopeItems && journal.focusScopeItems.length > 0 ? (
                <div className="product-focus-scope-grid">
                  {journal.focusScopeItems.map((item, idx) => (
                    <div key={idx} className="product-focus-scope-card">
                      <h4>{item.title}</h4>
                      <div dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
                    </div>
                  ))}
                </div>
              ) : (
                <p>{focus}</p>
              )
            ) : null}

            {tab === "INDEXING" ? (
              <div className="product-indexing-container" style={{ padding: "4px", display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Top Stats / Badges Row */}
                {(journal.icvValue || journal.indexingLogoImg || journal.impactFactor) && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "0.5rem"
                  }}>
                    
                    {/* Impact Factor KPI Card */}
                    {journal.impactFactor && (
                      <div style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "12px",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                        {/* Decorative stripe on left */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "#10b981" }}></div>
                        <div>
                          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", color: "#64748b" }}>
                            Quality Metric
                          </span>
                          <h4 style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: "700", marginTop: "4px", marginBottom: 0 }}>
                            Impact Factor
                          </h4>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "#0f172a", fontFamily: "serif", lineHeight: 1 }}>
                            {journal.impactFactor}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>
                          Based on citation database metrics
                        </span>
                      </div>
                    )}
                    
                    {/* ICV KPI Card */}
                    {journal.icvValue && (
                      <div style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "12px",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                        {/* Decorative stripe on left */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "#f59e0b" }}></div>
                        <div>
                          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", color: "#64748b" }}>
                            Impact Score
                          </span>
                          <h4 style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: "700", marginTop: "4px", marginBottom: 0 }}>
                            Index Copernicus Value (ICV)
                          </h4>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "#0f172a", fontFamily: "serif", lineHeight: 1 }}>
                            {journal.icvValue}
                          </span>
                        </div>
                        {journal.icvUrl && (
                          <a href={journal.icvUrl} target="_blank" rel="noopener noreferrer" style={{
                            alignSelf: "flex-start",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "underline"
                          }}>
                            Verify Benchmark
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Indexing Logo Card */}
                    {journal.indexingLogoImg && (
                      <div style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "12px",
                        minHeight: "160px"
                      }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", color: "#64748b", marginBottom: "4px", width: "100%" }}>
                          Certified Partner
                        </span>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                          {journal.indexingLogoUrl ? (
                            <a href={journal.indexingLogoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", transition: "transform 0.2s ease" }} className="hover-scale-logo">
                              <img 
                                src={journal.indexingLogoImg} 
                                alt="Indexing Partner Logo" 
                                style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }}
                              />
                            </a>
                          ) : (
                            <img 
                              src={journal.indexingLogoImg} 
                              alt="Indexing Partner Logo" 
                              style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: "1.2rem", color: "#0f172a", fontWeight: "700", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Indexing & Citations Network
                  </h3>
                  {journal.indexing ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {journal.indexing.split(",").map((item, idx) => {
                        const clean = item.trim();
                        if (!clean) return null;
                        return (
                          <div key={idx} style={{
                            padding: "0.75rem 1.25rem",
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "6px",
                            fontWeight: "600",
                            color: "#334155",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.875rem",
                            transition: "all 0.2s ease-out"
                          }}
                          className="indexing-badge-card hover-shadow-badge">
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", flexShrink: 0 }}></span>
                            {clean}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", fontStyle: "italic" }}>Indexing information is currently undergoing validation and updates.</p>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
