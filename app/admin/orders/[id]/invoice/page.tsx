import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getJournalCatalog } from "@/lib/journal-catalog";
import PrintButton from "@/app/components/print-button";

export const dynamic = "force-dynamic";

function isBookProduct(journalName: string, subject: string): boolean {
  const lowerName = journalName.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  return lowerSubject.includes("book") || lowerSubject.includes("monograph") || lowerName.includes("book") || lowerName.includes("monograph");
}

function getHsnCode(journalName: string, subject: string, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE"): string {
  if (plan === "ONLINE") return "998431";
  return isBookProduct(journalName, subject) ? "4901" : "4902";
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-IN");
}

export default async function OrderInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/account");

  const resolvedParams = await params;
  const order = await prisma.order.findUnique({ where: { id: resolvedParams.id }, include: { items: true } });
  if (!order) return <div style={{ padding: "40px", textAlign: "center" }}>Order not found.</div>;

  const catalog = await getJournalCatalog();
  const isJournalsPub = order.items.some((item) => {
    const cleanItemName = item.journalName.toLowerCase();
    const match = catalog.find((cat) => cleanItemName.includes(cat.journalName.toLowerCase()) || cat.journalName.toLowerCase().includes(cleanItemName));
    return !!(match && match.publisher && match.publisher.toLowerCase().replace(/[^a-z0-9]/g, "") === "journalspub");
  });

  const brand = isJournalsPub
    ? {
        title: "JOURNALS PUB",
        subtitle: "A Division of Dhruv Infosystems Private Limited",
        address: "A-118, 2nd Floor, A-Block, Sector-63, Noida - 201301, INDIA.",
        bankName: "HDFC Bank",
        bankAddress: "Sector-62, Noida, U.P., India",
        accountNumber: "03942000001077",
        ifscCode: "HDFC0002649",
        swiftCode: "HDFCINBBXXX",
        accountHolder: "Dhruv Infosystems Private Limited",
        gstin: "09AACCD1689F2ZJ",
        pan: "AACCD1689F",
        cin: "U74999DL2005PTC136381",
        legalName: "Dhruv Infosystems Private Limited",
        iecCode: "AACCD1689F",
        email: "Info@journalspub.com",
        regdOffice: "Office No. 4, First Floor, CSC Pocket - E, Mayur Vihar, Phase-II, New Delhi-110091"
      }
    : {
        title: "STM JOURNALS",
        subtitle: "A Division of Consortium e-Learning Network Pvt. Ltd.",
        address: "A-118, 1st Floor, A-Block, Sector-63, Noida - 201301, INDIA.",
        bankName: "HDFC Bank",
        bankAddress: "Sector-62, Noida, U.P., India",
        accountNumber: "03942000001153",
        ifscCode: "HDFC0002649",
        swiftCode: "HDFCINBBXXX",
        accountHolder: "Consortium eLearning Network Pvt. Ltd.",
        gstin: "09AACCC6494M1Z1",
        pan: "AACCC6494M",
        cin: "U80302DL2005PTC138759",
        legalName: "Consortium e-Learning Network Pvt. Ltd.",
        iecCode: "AACCC6494M",
        email: "info@stmjournals.in",
        regdOffice: "Office No. 4, First Floor, CSC Pocket - E, Mayur Vihar, Phase-II, New Delhi-110091"
      };

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const cgst = Number(order.cgst || 0);
  const sgst = Number(order.sgst || 0);
  const totalGst = cgst + sgst;
  const grandTotal = Number(order.total || 0);

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", padding: "30px 16px", fontFamily: "Inter, Arial, sans-serif" }}>
      <div className="no-print" style={{ maxWidth: "900px", margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/admin/orders" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 700 }}>← Back to Orders</a>
        <PrintButton />
      </div>

      <article style={{ background: "#fff", width: "100%", maxWidth: "900px", margin: "0 auto", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #cbd5e1" }}>
        <div style={{ border: "1px solid #94a3b8", padding: "1px" }}>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #94a3b8", padding: "15px 20px" }}>
            <div style={{ width: "15%", display: "flex", justifyContent: "center" }}>
              {isJournalsPub ? <img src="/journalspub-logo.png" alt="Journals Pub" style={{ maxHeight: "65px", objectFit: "contain" }} /> : <img src="/stmlogo.png" alt="STM" style={{ maxHeight: "65px", objectFit: "contain" }} />}
            </div>
            <div style={{ width: "85%", textAlign: "center", paddingRight: "10%" }}>
              <h1 style={{ fontSize: "34px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "0.5px" }}>{brand.title}</h1>
              <p style={{ fontSize: "12px", fontWeight: 600, margin: 0, color: "#334155" }}>{brand.subtitle}</p>
              <p style={{ fontSize: "11px", fontWeight: 700, margin: "4px 0 0 0", color: "#1e293b", letterSpacing: "0.04em" }}>TAX INVOICE</p>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{brand.address}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #94a3b8" }}>
            <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8" }}>
              <span style={labelStyle}>INVOICE NUMBER :</span>
              <div style={valueBigStyle}>{order.id}</div>
              <span style={labelStyle}>INVOICE DATE :</span>
              <div style={valueBigStyle}>{formatDate(order.createdAt)}</div>
              <span style={labelStyle}>STATUS :</span>
              <div style={{ ...valueBigStyle, color: order.status === "PAID" ? "#16a34a" : "#0f172a" }}>{order.status}</div>
            </div>
            <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8", fontSize: "11px" }}>
              <span style={{ ...labelStyle, display: "block", marginBottom: "6px" }}>BANK DETAILS:</span>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "4px 2px" }}>
                <strong style={{ color: "#475569" }}>Bank Name :</strong> <span>{brand.bankName}</span>
                <strong style={{ color: "#475569" }}>Bank Address :</strong> <span>{brand.bankAddress}</span>
                <strong style={{ color: "#475569" }}>A/C. Number :</strong> <span style={{ fontWeight: 700 }}>{brand.accountNumber}</span>
                <strong style={{ color: "#475569" }}>IFSC Code :</strong> <span>{brand.ifscCode}</span>
                <strong style={{ color: "#475569" }}>Swift Code :</strong> <span>{brand.swiftCode}</span>
                <strong style={{ color: "#475569" }}>A/C. Holder :</strong> <span style={{ fontWeight: 600 }}>{brand.accountHolder}</span>
              </div>
            </div>
            <div style={{ padding: "12px 15px", fontSize: "11px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "8px 2px" }}>
                <strong style={smallKeyStyle}>GSTIN :</strong> <span style={{ fontWeight: 700 }}>{brand.gstin}</span>
                <strong style={smallKeyStyle}>PAN No. :</strong> <span style={{ fontWeight: 700 }}>{brand.pan}</span>
                <strong style={smallKeyStyle}>CIN No. :</strong> <span style={{ fontWeight: 700 }}>{brand.cin}</span>
                <strong style={smallKeyStyle}>Legal Name :</strong> <span>{brand.legalName}</span>
                <strong style={smallKeyStyle}>IEC Code :</strong> <span style={{ fontWeight: 700 }}>{brand.iecCode}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #94a3b8", minHeight: "140px" }}>
            <div style={{ padding: "15px", borderRight: "1px solid #94a3b8" }}>
              <h4 style={sectionTitleStyle}>BILL TO / DETAILS OF RECEIVER:</h4>
              <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", gap: "6px 4px", fontSize: "11.5px" }}>
                <strong style={{ color: "#64748b" }}>Name :</strong> <span style={{ fontWeight: 700 }}>{order.customerName || "N/A"}</span>
                <strong style={{ color: "#64748b" }}>Institution :</strong> <span style={{ fontWeight: 600 }}>{order.organization || "N/A"}</span>
                <strong style={{ color: "#64748b" }}>Address :</strong> <span>{order.address}, {order.state} - {order.pincode}<br/>Email: {order.email}</span>
                <strong style={{ color: "#64748b" }}>GSTIN :</strong> <span style={{ fontWeight: 700 }}>{order.gstNumber || "N/A"}</span>
              </div>
            </div>
            <div style={{ padding: "15px" }}>
              <h4 style={sectionTitleStyle}>SHIP TO / DELIVERY ADDRESS:</h4>
              <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", gap: "6px 4px", fontSize: "11.5px" }}>
                <strong style={{ color: "#64748b" }}>Recipient :</strong> <span style={{ fontWeight: 700 }}>{order.sameAsBilling ? order.customerName : (order.receiverName || order.customerName)}</span>
                <strong style={{ color: "#64748b" }}>Address :</strong> <span>{order.sameAsBilling ? order.address : (order.receiverAddress || order.address)}</span>
                <strong style={{ color: "#64748b" }}>Contact :</strong> <span>{order.sameAsBilling ? "Same as billing" : (order.receiverPhone || "N/A")}</span>
              </div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #94a3b8" }} cellPadding={6}>
            <thead>
              <tr style={{ borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontSize: "10.5px", fontWeight: 800 }}>
                <th style={th(5)}>Sr.No</th>
                <th style={th(28, "left")}>Particulars</th>
                <th style={th(9)}>HSN/SAC</th>
                <th style={th(6)}>Qty</th>
                <th style={th(10, "right")}>Unit Price</th>
                <th style={th(10, "right")}>Amount</th>
                <th style={th(10, "right")}>Discount</th>
                <th style={th(10, "right")}>Taxable Value</th>
                <th style={th(6, "right")}>GST Rate (%)</th>
                <th style={th(10, "right", true)}>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const qty = Number(item.qty || 1);
                const amount = Number(item.unitPrice || 0) * qty;
                const itemDiscount = subtotal > 0 ? (amount / subtotal) * discount : 0;
                const taxable = amount - itemDiscount;
                const itemGst = subtotal > 0 ? (amount / subtotal) * totalGst : 0;
                const net = taxable + itemGst;
                const gstRate = taxable > 0 ? (itemGst / taxable) * 100 : 0;

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "11.5px" }}>
                    <td style={td()}>{idx + 1}</td>
                    <td style={td("left")}>{item.journalName}<div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>Year: {item.year} | {item.selectedPlan}</div></td>
                    <td style={td()}>{getHsnCode(item.journalName, item.subject || "", item.selectedPlan)}</td>
                    <td style={td()}>{qty}</td>
                    <td style={td("right")}>{Number(item.unitPrice || 0).toFixed(2)}</td>
                    <td style={td("right")}>{amount.toFixed(2)}</td>
                    <td style={td("right")}>{itemDiscount.toFixed(2)}</td>
                    <td style={td("right")}>{taxable.toFixed(2)}</td>
                    <td style={td("right")}>{gstRate.toFixed(2)}</td>
                    <td style={{ ...td("right", true), fontWeight: 700 }}>{net.toFixed(2)}</td>
                  </tr>
                );
              })}

              <tr>
                <td colSpan={6} style={{ borderRight: "1px solid #94a3b8", borderTop: "1px solid #94a3b8", verticalAlign: "top", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#334155" }}><strong>In Words:</strong> Indian Rupees {Math.round(grandTotal).toLocaleString("en-IN")} Only</div>
                </td>
                <td colSpan={4} style={{ borderTop: "1px solid #94a3b8", padding: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "4px", padding: "10px", fontSize: "11.5px" }}>
                    <span style={{ textAlign: "right", color: "#64748b" }}>Subtotal:</span><span style={{ textAlign: "right", fontWeight: 600 }}>{subtotal.toFixed(2)}</span>
                    <span style={{ textAlign: "right", color: "#64748b" }}>Discount:</span><span style={{ textAlign: "right", color: "#ef4444" }}>{discount.toFixed(2)}</span>
                    {cgst > 0 && <><span style={{ textAlign: "right", color: "#64748b" }}>CGST (9%):</span><span style={{ textAlign: "right" }}>{cgst.toFixed(2)}</span></>}
                    {sgst > 0 && <><span style={{ textAlign: "right", color: "#64748b" }}>SGST (9%):</span><span style={{ textAlign: "right" }}>{sgst.toFixed(2)}</span></>}
                    <span style={{ textAlign: "right", fontWeight: 800, borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px" }}>Total (INR):</span>
                    <span style={{ textAlign: "right", fontWeight: 800, borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px" }}>{grandTotal.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ padding: "12px 15px", borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontStyle: "italic", color: "#334155", fontSize: "11px" }}>
            The sum of INR {Math.round(grandTotal)}/- is payment on account of subscription by NEFT/RTGS.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", padding: "15px" }}>
            <div>
              <strong style={{ fontSize: "10px", textDecoration: "underline", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>TERMS & CONDITIONS:</strong>
              <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "10.5px", color: "#475569", lineHeight: 1.6 }}>
                <li>All subscription amount mentioned is as per yearly fee.</li>
                <li>Missing numbers will not be supplied if claims are received after six months.</li>
                <li>Publisher is not responsible for foreign delivery delays once posted.</li>
                <li>Invoice subject to realization of demand draft/cheque.</li>
              </ol>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", textAlign: "center" }}>
              <strong style={{ color: "#0f172a", fontSize: "11px", marginBottom: "8px" }}>For, {brand.title}</strong>
              <img src="/authorized-signature.png" alt="Authorised Signature" style={{ width: "130px", height: "auto", objectFit: "contain", marginBottom: "6px" }} />
              <div style={{ width: "180px", borderBottom: "1px solid #64748b" }}></div>
              <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", marginTop: "5px" }}>AUTHORISED SIGNATORY</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "12px", fontSize: "10px", color: "#64748b", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
          <strong>Regd. Office:</strong> {brand.regdOffice}<br />
          <strong>Email:</strong> {brand.email}
        </div>
      </article>
    </main>
  );
}

const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" };
const valueBigStyle: React.CSSProperties = { fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "4px 0 10px 0" };
const smallKeyStyle: React.CSSProperties = { color: "#475569", fontSize: "10px", textTransform: "uppercase" };
const sectionTitleStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 750, textTransform: "uppercase", borderBottom: "1.5px solid #334155", paddingBottom: "4px", margin: "0 0 12px 0", display: "inline-block", color: "#1e293b" };

function th(width: number, align: "center" | "left" | "right" = "center", last = false): React.CSSProperties {
  return { width: `${width}%`, borderRight: last ? "none" : "1px solid #94a3b8", textAlign: align };
}

function td(align: "center" | "left" | "right" = "center", last = false): React.CSSProperties {
  return { borderRight: last ? "none" : "1px solid #94a3b8", textAlign: align, color: "#334155" };
}
