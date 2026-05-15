"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type JournalItem = {
  serialNo: number;
  subject: string;
  journalName: string;
  abbreviation: string;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  printUsd: number;
  onlineUsd: number;
  combinedUsd: number;
  issn: string | null;
  frequency: string | null;
  indexing: string | null;
};

type Props = {
  journals: JournalItem[];
  initialCurrency?: "INR" | "USD";
};

export default function CataloguesClient({ journals, initialCurrency = "INR" }: Props) {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("All Domains");
  const [currency, setCurrency] = useState<"INR" | "USD">(initialCurrency);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const domains = useMemo(() => {
    const set = new Set(journals.map((j) => j.subject).filter(Boolean));
    return ["All Domains", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [journals]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return journals.filter((item) => {
      const byDomain = domain === "All Domains" || item.subject === domain;
      if (!byDomain) return false;
      if (!q) return true;
      const haystack = [
        String(item.serialNo),
        item.subject,
        item.journalName,
        item.abbreviation,
        item.issn || "",
        item.frequency || "",
        item.indexing || ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [journals, keyword, domain]);

  function onPrint() {
    window.print();
  }

  function onDownloadPdf() {
    const logoSrc = "/stmlogo.png";
    
    const generateWithHeader = (imgElement?: HTMLImageElement) => {
      const doc = new jsPDF({ orientation: "landscape" });
      
      let textX = 14;
      let startY = 28;
      
      if (imgElement) {
        const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        const imgWidth = 25;
        const imgHeight = imgWidth / (aspectRatio || 1);
        
        try {
          doc.addImage(imgElement, "PNG", 14, 8, imgWidth, imgHeight);
          textX = 14 + imgWidth + 6;
          startY = Math.max(28, 8 + imgHeight + 6);
        } catch (e) {
          console.error("Failed adding image to PDF", e);
        }
      }
      
      // Company Name & Brand
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 42, 87); // #0F2A57
      doc.text("Consortium e-Learning Network Pvt. Ltd. - STM Journals", textX, 13);
      
      // Catalog Title
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("Full Price List Catalog - 2026", textX, 18);
      
      // Subtitle parameters
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const subtitle = `Domain: ${domain} | Keyword: ${keyword || "All"} | Currency: ${currency}`;
      doc.text(subtitle, textX, 23);
      
      autoTable(doc, {
        startY: startY < 28 ? 28 : startY,
        head: [["S.NO", "JOURNAL TITLE", "ISSN", "FREQUENCY", "PRINT", "DIGITAL", "COMBINED"]],
        body: filtered.map((item) => {
          const print = currency === "INR" ? item.printInr : item.printUsd;
          const online = currency === "INR" ? item.onlineInr : item.onlineUsd;
          const combined = currency === "INR" ? item.combinedInr : item.combinedUsd;
          const fmt = (v: number) =>
            currency === "INR" ? `Rs ${v.toLocaleString("en-IN")}` : `$${v.toLocaleString("en-US")}`;

          return [
            item.serialNo,
            `${item.journalName}\n${item.subject}`,
            item.issn || "-",
            item.frequency || "-",
            fmt(print),
            fmt(online),
            fmt(combined)
          ];
        }),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 42, 87] }, // Brand Blue
        columnStyles: { 1: { cellWidth: 95 } }
      });
      
      // Dynamic bottom layout for corporate payment block
      const finalY = (doc as any).lastAutoTable.finalY || startY;
      let y = finalY + 15;
      
      // Check if there's sufficient space on page (Height=210 for Landscape).
      // Block requires ~60mm. If lower than 135, add page.
      if (y > 135) {
        doc.addPage("landscape");
        y = 20;
      }
      
      // Top Separator
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.line(14, y - 8, 283, y - 8);
      
      // Main Payment Section Heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 42, 87); // #0F2A57
      doc.text("Payment Details for Journal Subscription", 14, y);
      
      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Institutions, libraries, and individuals who wish to subscribe to STM Journals may remit the subscription fee using any of the payment modes mentioned below.", 14, y + 5);
      
      y += 12;
      
      // Left Col: 1. Payment via NEFT / RTGS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 42, 87);
      doc.text("1. Payment via NEFT / RTGS", 14, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      let rowY = y + 5;
      doc.text("Account Name: Consortium eLearning Network Pvt. Ltd.", 14, rowY);
      doc.text("Account Number: 03942000001153", 14, rowY + 4);
      doc.text("Bank Name: HDFC Bank", 14, rowY + 8);
      doc.text("Branch: Sector-62, Noida, Uttar Pradesh, India", 14, rowY + 12);
      doc.text("IFSC Code: HDFC0002649", 14, rowY + 16);
      doc.text("SWIFT Code: HDFCINBBXXX", 14, rowY + 20);
      
      // Right Col: 2. Payment via Demand Draft / Cheque
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 42, 87);
      doc.text("2. Payment via Demand Draft / Cheque", 150, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Demand Draft or Cheque should be drawn in favor of", 150, rowY);
      doc.text('"Consortium eLearning Network Pvt. Ltd."', 150, rowY + 4);
      doc.text("Address: A-118, Level 1, Sector 63, Noida – 201301", 150, rowY + 8);
      doc.text("Uttar Pradesh, India", 150, rowY + 12);
      doc.text("Tel: +91-120-4781206", 150, rowY + 16);
      doc.text("Mobile: +91-9810078958", 150, rowY + 20);
      
      y += 30;
      
      // Important Note Background box
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.rect(14, y, 269, 16, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 42, 87);
      doc.text("Important Note:", 20, y + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("After making the payment, kindly share the payment details / transaction reference number at", 20, y + 11);
      
      doc.setTextColor(37, 99, 235); // Blue link #2563EB
      doc.text("subscriptions@stmjournals.com", 160, y + 11);
      
      doc.save(`catalogues-list-${currency.toLowerCase()}.pdf`);
    };

    const img = new Image();
    img.src = logoSrc;
    img.onload = () => generateWithHeader(img);
    img.onerror = () => generateWithHeader();
  }

  return (
    <main className="catalogues-v2">
      <section className="catalogues-hero">
        <div>
          <h1>Full Price List Catalog - 2026</h1>
          <p style={{ marginBottom: "20px" }}>
            Official pricing for Institutional and Individual subscriptions within India. All prices are in Indian
            Rupees (INR).
          </p>
          
          <button
            type="button"
            className="catalogues-view-toggle"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          >
            {viewMode === "list" ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Switch to Grid View
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Switch to List View
              </>
            )}
          </button>
        </div>
        <div className="catalogues-actions">
          <button type="button" className="catalogues-ghost" onClick={onPrint}>
            <svg style={{ width: 16, height: 16, marginRight: 8, display: "inline-block", verticalAlign: "middle" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print List
          </button>
          <button type="button" className="catalogues-primary" onClick={onDownloadPdf}>
            <svg style={{ width: 16, height: 16, marginRight: 8, display: "inline-block", verticalAlign: "middle" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        </div>
      </section>

      <section className="catalogues-toolbar">
        <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
          <input
            type="text"
            placeholder="Live Search ..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="catalogues-search"
            style={{ paddingLeft: "42px" }}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ position: "absolute", left: "14px", width: "18px", height: "18px", color: "#94a3b8" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span
            style={{
              position: "absolute",
              right: "12px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#dcfce7",
              color: "#15803d",
              borderRadius: "99px",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%" }}></span>
            LIVE
          </span>
        </div>

        <div style={{ width: "100%" }}>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="catalogues-domain">
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="catalogues-currency">
          <span>CURRENCY:</span>
          <button
            type="button"
            className={currency === "INR" ? "active" : ""}
            onClick={() => setCurrency("INR")}
          >
            INR
          </button>
          <button
            type="button"
            className={currency === "USD" ? "active" : ""}
            onClick={() => setCurrency("USD")}
          >
            USD
          </button>
        </div>

        <div className="catalogues-results">Filtered <strong>{filtered.length}</strong> results</div>
      </section>

      {viewMode === "grid" ? (
        <section className="catalogues-grid-container">
          {filtered.map((item) => {
            const print = currency === "INR" ? item.printInr : item.printUsd;
            const online = currency === "INR" ? item.onlineInr : item.onlineUsd;
            const combined = currency === "INR" ? item.combinedInr : item.combinedUsd;
            const fmt = (v: number) =>
              currency === "INR" ? `₹${v.toLocaleString("en-IN")}` : `$${v.toLocaleString("en-US")}`;

            return (
              <article key={item.serialNo} className="catalogue-grid-card">
                <div className="grid-card-header">
                  <span className="serial-no">{item.serialNo}</span>
                </div>
                <h3 className="journal-title">{item.journalName}</h3>
                <div className="subject-label">{item.subject.toUpperCase()}</div>
                <div className="card-details">
                  <p><span>issn:</span> {item.issn || "-"}</p>
                  <p><span>Freq:</span> {item.frequency || "-"}</p>
                </div>
                <div className="price-rows">
                  <div className="price-row print">
                    <span>Print</span>
                    <strong>{fmt(print)}</strong>
                  </div>
                  <div className="price-row online">
                    <span>Digital</span>
                    <strong>{fmt(online)}</strong>
                  </div>
                  <div className="price-row combo">
                    <span>Combined</span>
                    <strong>{fmt(combined)}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="catalogues-table-shell">
          <table className="catalogues-table-v2">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>JOURNAL TITLE</th>
                <th>ISSN</th>
                <th>FREQUENCY</th>
                <th>{currency === "INR" ? "PRINT (INR)" : "PRINT (USD)"}</th>
                <th>{currency === "INR" ? "DIGITAL (INR)" : "DIGITAL (USD)"}</th>
                <th>{currency === "INR" ? "COMBINED (INR)" : "COMBINED (USD)"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const print = currency === "INR" ? item.printInr : item.printUsd;
                const online = currency === "INR" ? item.onlineInr : item.onlineUsd;
                const combined = currency === "INR" ? item.combinedInr : item.combinedUsd;
                const fmt = (v: number) =>
                  currency === "INR" ? `₹${v.toLocaleString("en-IN")}` : `$${v.toLocaleString("en-US")}`;

                return (
                  <tr key={item.serialNo}>
                    <td>{item.serialNo}</td>
                    <td>
                      <div className="catalogues-journal">{item.journalName}</div>
                      <div className="catalogues-subject">{item.subject.toUpperCase()}</div>
                    </td>
                    <td>{item.issn || "-"}</td>
                    <td>{item.frequency || "-"}</td>
                    <td className="price print">{fmt(print)}</td>
                    <td className="price online">{fmt(online)}</td>
                    <td className="price combo">{fmt(combined)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <footer className="catalogues-page-footer">
        Consortium e-Learning Network Pvt. Ltd. - STM Journals
      </footer>
    </main>
  );
}

