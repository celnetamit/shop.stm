import SignatureBlock from "@/app/components/invoice/signature-block";

export type ProformaEmailDocumentProps = {
  piNo: string;
  createdAt: string;
  status: string;
  companyName: string;
  companyLines: string[];
  customerName: string;
  organization: string;
  email: string;
  address: string;
  receiverName: string;
  receiverAddress: string;
  currency: "INR" | "USD";
  items: Array<{
    journalName: string;
    subject: string;
    selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE";
    unitPrice: number;
    hsn: string;
  }>;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  footerNote: string;
};

export default function ProformaEmailDocument(props: ProformaEmailDocumentProps) {
  const {
    piNo,
    createdAt,
    status,
    companyName,
    companyLines,
    customerName,
    organization,
    email,
    address,
    receiverName,
    receiverAddress,
    currency,
    items,
    subtotal,
    discount,
    gst,
    total,
    footerNote
  } = props;

  return (
    <main style={{ minHeight: "100vh", background: "#F1F5F9", padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", background: "white", padding: "26px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", border: "1px solid #CBD5E1" }}>
        <div style={{ border: "1px solid #94A3B8" }}>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #94A3B8", padding: "14px 16px" }}>
            <div style={{ width: "13%", display: "flex", justifyContent: "center" }}>
              <img src="/stmlogo.png" alt={companyName} style={{ maxHeight: "60px", width: "auto", objectFit: "contain" }} />
            </div>
            <div style={{ width: "87%", textAlign: "center", paddingRight: "10%" }}>
              <h2 style={{ margin: 0, fontSize: "28px", color: "#0F172A", fontWeight: 800, letterSpacing: "0.03em" }}>{companyName.toUpperCase()}</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#475569", fontWeight: 600 }}>{companyLines[0] || ""}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#0F172A", fontWeight: 800, letterSpacing: "0.05em" }}>PROFORMA INVOICE</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>{companyLines[1] || ""}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #94A3B8" }}>
            <div style={{ padding: "12px 14px", borderRight: "1px solid #94A3B8" }}>
              <p style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "11px", fontWeight: 700 }}>PROFORMA INVOICE NUMBER :</p>
              <p style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "17px", fontWeight: 800 }}>{piNo}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "11px", fontWeight: 700 }}>DATE</p>
              <p style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "14px", fontWeight: 700 }}>{new Date(createdAt).toLocaleDateString("en-IN")}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "11px", fontWeight: 700 }}>STATUS</p>
              <p style={{ margin: 0, color: "#0F172A", fontSize: "14px", fontWeight: 700 }}>{status}</p>
            </div>
            <div style={{ padding: "12px 14px", fontSize: "11px", color: "#475569" }}>
              {companyLines.slice(2).map((line, idx) => (
                <p key={`${line}-${idx}`} style={{ margin: idx === companyLines.length - 3 ? "0 0 10px 0" : "0 0 4px 0" }}>{line}</p>
              ))}
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #CBD5E1" }}>
                <p style={{ margin: 0, color: "#64748B", fontSize: "12px" }}>Proforma generated for institutional processing.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", borderBottom: "1px solid #94A3B8" }}>
            <div style={{ padding: "12px 14px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#0F172A", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>Bill To:</h3>
              <p style={{ margin: "0 0 4px 0", color: "#1E293B", fontSize: "14px", fontWeight: 700 }}>{customerName}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "12px" }}>{organization || "N/A"}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "12px" }}>{email}</p>
              <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "12px" }}>{address}</p>
              <p style={{ margin: 0, color: "#475569", fontSize: "12px" }}>Receiver: {receiverName}</p>
              <p style={{ margin: 0, color: "#475569", fontSize: "12px" }}>Receiver Address: {receiverAddress}</p>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #94A3B8" }}>
                <th style={{ width: "8%", padding: "12px", textAlign: "left", color: "#334155", fontSize: "14px" }}>S.No</th>
                <th style={{ width: "52%", padding: "12px", textAlign: "left", color: "#334155", fontSize: "14px" }}>Item Description</th>
                <th style={{ width: "14%", padding: "12px", textAlign: "center", color: "#334155", fontSize: "14px" }}>HSN/SAC</th>
                <th style={{ width: "12%", padding: "12px", textAlign: "center", color: "#334155", fontSize: "14px" }}>Plan</th>
                <th style={{ width: "14%", padding: "12px", textAlign: "right", color: "#334155", fontSize: "14px" }}>Price ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.journalName}-${index}`} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px", color: "#475569", fontSize: "14px" }}>{index + 1}</td>
                  <td style={{ padding: "12px", color: "#0F172A", fontSize: "14px", fontWeight: 500 }}>
                    {item.journalName}
                    <div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>{item.subject}</div>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.hsn}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.selectedPlan}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#0F172A", fontSize: "14px" }}>{item.unitPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #94A3B8", padding: "10px 12px" }}>
            <div style={{ width: "360px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                <span>Subtotal:</span>
                <span>{currency} {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#16A34A", fontSize: "13px", fontWeight: 500 }}>
                  <span>Discount:</span>
                  <span>{currency} {discount.toLocaleString()}</span>
                </div>
              ) : null}
              {gst > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#475569", fontSize: "13px", fontWeight: 500 }}>
                  <span>GST:</span>
                  <span>{currency} {gst.toLocaleString()}</span>
                </div>
              ) : null}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 2px 0", color: "#0F172A", fontSize: "16px", fontWeight: 800, borderTop: "1.5px solid #334155", marginTop: "4px" }}>
                <span>Total Amount:</span>
                <span>{currency} {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 14px", borderTop: "1px solid #94A3B8", color: "#64748B", fontSize: "11px", textAlign: "center" }}>
            <p style={{ margin: 0 }}>{footerNote}</p>
          </div>

          <div style={{ borderTop: "1px solid #94A3B8", padding: "14px 16px" }}>
            <SignatureBlock brandTitle={companyName} />
          </div>
        </div>
      </div>
    </main>
  );
}
