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

      doc.save(`catalogues-list-${currency.toLowerCase()}.pdf`);
    };

    const img = new Image();
    img.src = logoSrc;
    img.onload = () => generateWithHeader(img);
    img.onerror = () => generateWithHeader();
  }

  return (
    <main className="catalogues-v2">
      <header className="catalogues-page-header">
        <div className="catalogues-page-brand">STM Journals</div>
        <div className="catalogues-page-links">
          <a href="/">Home</a>
          <a href="/catalogues-list?currency=INR">Catalogues</a>
          <a href="/catalogues-list?currency=USD">View USD List (International)</a>
          <a href="/login">Login</a>
        </div>
      </header>

      <section className="catalogues-hero">
        <div>
          <h1>Full Price List Catalog - 2026</h1>
          <p>
            Official pricing for Institutional and Individual subscriptions within India. All prices are in Indian
            Rupees (INR).
          </p>
        </div>
        <div className="catalogues-actions">
          <button type="button" className="catalogues-ghost" onClick={onPrint}>Print List</button>
          <button type="button" className="catalogues-primary" onClick={onDownloadPdf}>Download PDF</button>
        </div>
      </section>

      <section className="catalogues-toolbar">
        <input
          type="text"
          placeholder="Live Search ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="catalogues-search"
        />

        <select value={domain} onChange={(e) => setDomain(e.target.value)} className="catalogues-domain">
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

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

      <footer className="catalogues-page-footer">
        Consortium e-Learning Network Pvt. Ltd. - STM Journals
      </footer>
    </main>
  );
}
