"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/components/cart-store";

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
};

type Props = {
  journal: Journal;
  domains: string[];
  description: string;
  about: string;
  focus: string;
};

type Plan = "PRINT" | "ONLINE" | "PRINT_ONLINE";
type Tab = "DESCRIPTION" | "ABOUT" | "FOCUS";

export default function ProductDetailClient({ journal, domains, description, about, focus }: Props) {
  const { addItem, items } = useCart();
  const year = new Date().getFullYear();
  const years = [year, year - 1, year - 2];

  const [plan, setPlan] = useState<Plan>("ONLINE");
  const [selectedYear, setSelectedYear] = useState<string>(String(year));
  const [selectedIssue, setSelectedIssue] = useState<string>("All(Jan-Dec)");
  const [tab, setTab] = useState<Tab>("DESCRIPTION");

  const price = useMemo(() => {
    if (plan === "PRINT") return journal.printInr;
    if (plan === "ONLINE") return journal.onlineInr;
    return journal.combinedInr;
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
              </p>
              <p className="product-v2-copy">{description}</p>
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
                    <option value="1(Jan-June)">1(Jan-June)</option>
                    <option value="2(July-Dec)">2(July-Dec)</option>
                    <option value="All(Jan-Dec)">All(Jan-Dec)</option>
                  </select>
                </div>
              </div>

              <div className="product-v2-current-price">Selected Price: ₹{price.toLocaleString("en-IN")}</div>
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
          </div>

          <section className="product-v2-panel">
            {tab === "DESCRIPTION" ? <p>{description}</p> : null}

            {tab === "ABOUT" ? (
              <div>
                <table className="product-v2-about-table">
                  <tbody>
                    <tr><th>Journal Name</th><td>{journal.journalName}</td></tr>
                    <tr><th>Domain</th><td>{journal.subject}</td></tr>
                    <tr><th>ISSN</th><td>{journal.issn || "N/A"}</td></tr>
                    <tr><th>Started Since</th><td>{journal.startedSince || "N/A"}</td></tr>
                    <tr><th>Frequency</th><td>{journal.frequency || "N/A"}</td></tr>
                  </tbody>
                </table>
                <p>{about}</p>
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
          </section>
        </section>
      </div>
    </main>
  );
}
