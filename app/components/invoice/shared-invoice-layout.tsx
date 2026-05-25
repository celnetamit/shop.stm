import PrintButton from "@/app/components/print-button";
import { ReactNode } from "react";

type TotalsRow = {
  label: string;
  value: string;
  tone?: "normal" | "success" | "strong";
};

type Props = {
  backHref: string;
  backLabel: string;
  title: string;
  numberLabel: string;
  numberValue: string;
  dateValue: string;
  statusValue: string;
  companyName: string;
  companyLines: string[];
  billToTitle?: string;
  billToLines: string[];
  metaPanel?: ReactNode;
  tableColGroup?: ReactNode;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  totals: TotalsRow[];
  footerNote: string;
};

export default function SharedInvoiceLayout(props: Props) {
  const {
    backHref,
    backLabel,
    title,
    numberLabel,
    numberValue,
    dateValue,
    statusValue,
    companyName,
    companyLines,
    billToTitle = "Bill To:",
    billToLines,
    metaPanel,
    tableColGroup,
    tableHeader,
    tableBody,
    totals,
    footerNote
  } = props;

  const normalizedCompany = companyName.toLowerCase();
  const isJournalsPubCompany = normalizedCompany.includes("journals pub") || normalizedCompany.includes("journalspub");
  const logoSrc = isJournalsPubCompany ? "/journalspub-logo.png" : "/stmlogo.png";

  return (
    <main style={{ minHeight: "100vh", background: "#F1F5F9", padding: "40px 20px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .invoice-grid-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .invoice-grid-table thead tr {
          background: #f8fafc;
          border-bottom: 1px solid #94a3b8;
        }
        .invoice-grid-table th,
        .invoice-grid-table td {
          border-right: 1px solid #94a3b8;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
          word-break: break-word;
        }
        .invoice-grid-table th:last-child,
        .invoice-grid-table td:last-child {
          border-right: none;
        }
        .invoice-grid-table th {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: none;
          color: #334155;
          padding: 8px 6px !important;
        }
        .invoice-grid-table td {
          font-size: 11.5px;
          color: #334155;
          padding: 8px 6px !important;
          line-height: 1.35;
        }
        .invoice-grid-table tbody tr:last-child td {
          border-bottom: none;
        }

        @media print {
          body { background: white !important; }
          .site-header, .site-footer, .no-print, .admin-sidebar { display: none !important; }
          .invoice-card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .admin-layout { display: block !important; background: white !important; min-height: auto !important; padding: 0 !important; }
          .admin-content { display: block !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          main { padding: 0 !important; background: white !important; }
        }
      ` }} />

      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href={backHref} style={{ color: "#3B82F6", textDecoration: "none", fontWeight: "bold" }}>← {backLabel}</a>
        <PrintButton />
      </div>

      <div className="invoice-card" style={{ maxWidth: "900px", margin: "0 auto", background: "white", padding: "26px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", border: "1px solid #CBD5E1" }}>
        <div style={{ border: "1px solid #94A3B8" }}>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #94A3B8", padding: "14px 16px" }}>
            <div style={{ width: "13%", display: "flex", justifyContent: "center" }}>
              <img
                src={logoSrc}
                alt={companyName}
                style={{ maxHeight: "60px", width: "auto", objectFit: "contain" }}
              />
            </div>
            <div style={{ width: "87%", textAlign: "center", paddingRight: "10%" }}>
              <h2 style={{ margin: 0, fontSize: "28px", color: "#0F172A", fontWeight: 800, letterSpacing: "0.03em" }}>{companyName.toUpperCase()}</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#475569", fontWeight: 600 }}>{companyLines[0] || ""}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#0F172A", fontWeight: 800, letterSpacing: "0.05em" }}>{title}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #94A3B8" }}>
            <div style={{ padding: "12px 14px", borderRight: "1px solid #94A3B8" }}>
              <p style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "11px", fontWeight: 700 }}>{numberLabel}</p>
              <p style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "17px", fontWeight: 800 }}>{numberValue}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "11px", fontWeight: 700 }}>DATE</p>
              <p style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "14px", fontWeight: 700 }}>{dateValue}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "11px", fontWeight: 700 }}>STATUS</p>
              <p style={{ margin: 0, color: "#0F172A", fontSize: "14px", fontWeight: 700 }}>{statusValue}</p>
            </div>
            <div style={{ padding: "12px 14px", fontSize: "11px", color: "#475569" }}>
              {companyLines.slice(1).map((line, idx) => (
                <p key={`${line}-${idx}`} style={{ margin: idx === companyLines.length - 2 ? "0 0 10px 0" : "0 0 4px 0" }}>{line}</p>
              ))}
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #CBD5E1" }}>
                {metaPanel || <p style={{ margin: 0, color: "#64748B", fontSize: "12px" }}>-</p>}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", borderBottom: "1px solid #94A3B8" }}>
            <div style={{ padding: "12px 14px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#0F172A", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>{billToTitle}</h3>
              {billToLines.map((line, idx) => (
                <p key={`${line}-${idx}`} style={{ margin: idx === billToLines.length - 1 ? 0 : "0 0 4px 0", color: idx === 0 ? "#1E293B" : "#475569", fontSize: idx === 0 ? "14px" : "12px", fontWeight: idx === 0 ? "700" : "400" }}>{line}</p>
              ))}
            </div>
          </div>

          <table className="invoice-grid-table">
            {tableColGroup || null}
            <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #94A3B8" }}>{tableHeader}</thead>
            <tbody>{tableBody}</tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #94A3B8", padding: "10px 12px" }}>
            <div style={{ width: "360px" }}>
              {totals.map((row, idx) => (
                <div key={`${row.label}-${idx}`} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: idx === totals.length - 1 ? "10px 0 2px 0" : "6px 0",
                  color: row.tone === "strong" ? "#0F172A" : row.tone === "success" ? "#16A34A" : "#475569",
                  fontSize: row.tone === "strong" ? "16px" : "13px",
                  fontWeight: row.tone === "strong" ? "800" : "500",
                  borderTop: idx === totals.length - 1 ? "1.5px solid #334155" : "none",
                  marginTop: idx === totals.length - 1 ? "4px" : "0"
                }}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "12px 14px", borderTop: "1px solid #94A3B8", color: "#64748B", fontSize: "11px", textAlign: "center" }}>
            <p style={{ margin: 0 }}>{footerNote}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
