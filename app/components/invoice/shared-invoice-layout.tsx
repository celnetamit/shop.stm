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
    tableHeader,
    tableBody,
    totals,
    footerNote
  } = props;

  return (
    <main style={{ minHeight: "100vh", background: "#F1F5F9", padding: "40px 20px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
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

      <div className="invoice-card" style={{ maxWidth: "800px", margin: "0 auto", background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #E2E8F0", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "28px", fontWeight: "800" }}>{title}</h1>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>{numberLabel}: <strong>{numberValue}</strong></p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Date: {dateValue}</p>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>Status: <strong>{statusValue}</strong></p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "20px" }}>{companyName}</h2>
            {companyLines.map((line, idx) => (
              <p key={`${line}-${idx}`} style={{ margin: idx === companyLines.length - 1 ? 0 : "0 0 4px 0", color: "#475569", fontSize: "14px" }}>{line}</p>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" }}>
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "16px", textTransform: "uppercase" }}>{billToTitle}</h3>
            {billToLines.map((line, idx) => (
              <p key={`${line}-${idx}`} style={{ margin: idx === billToLines.length - 1 ? 0 : "0 0 4px 0", color: idx === 0 ? "#1E293B" : "#475569", fontSize: idx === 0 ? "16px" : "14px", fontWeight: idx === 0 ? "700" : "400" }}>{line}</p>
            ))}
          </div>
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px" }}>
            {metaPanel || <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>-</p>}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead style={{ background: "#F8FAFC", borderBottom: "2px solid #CBD5E1" }}>{tableHeader}</thead>
          <tbody>{tableBody}</tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "320px" }}>
            {totals.map((row, idx) => (
              <div key={`${row.label}-${idx}`} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: idx === totals.length - 1 ? "12px 0" : "8px 0",
                color: row.tone === "strong" ? "#0F172A" : row.tone === "success" ? "#16A34A" : "#475569",
                fontSize: row.tone === "strong" ? "18px" : "14px",
                fontWeight: row.tone === "strong" ? "700" : "400",
                borderTop: idx === totals.length - 1 ? "2px solid #E2E8F0" : "none",
                marginTop: idx === totals.length - 1 ? "8px" : "0"
              }}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "50px", paddingTop: "20px", borderTop: "1px solid #E2E8F0", color: "#64748B", fontSize: "12px", textAlign: "center" }}>
          <p style={{ margin: 0 }}>{footerNote}</p>
        </div>
      </div>
    </main>
  );
}
