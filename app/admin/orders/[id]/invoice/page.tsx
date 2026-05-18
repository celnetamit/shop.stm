import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PrintButton from "@/app/components/print-button";

export const dynamic = "force-dynamic";

function isBookProduct(journalName: string, subject: string): boolean {
  const lowerName = journalName.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  return (
    lowerSubject.includes("book") ||
    lowerSubject.includes("monograph") ||
    lowerSubject.includes("nstc") ||
    lowerName.includes("book") ||
    lowerName.includes("monograph") ||
    lowerName.includes("handbook") ||
    lowerName.includes("textbook") ||
    lowerName.includes("reference book")
  );
}

function getHsnCode(journalName: string, subject: string, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE"): string {
  if (plan === "ONLINE") return "998431";
  const isBook = isBookProduct(journalName, subject);
  return isBook ? "4901" : "4902";
}

export default async function OrderInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/account");

  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: { items: true, user: true }
  });

  if (!order) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Order not found.</div>;
  }

  const hasTransaction = !!order.razorpayPaymentId;

  return (
    <main style={{ minHeight: "100vh", background: "#F1F5F9", padding: "40px 20px", fontFamily: "Inter, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .site-header, .site-footer, .no-print, .admin-sidebar { display: none !important; }
          .invoice-card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .admin-layout { display: block !important; background: white !important; min-height: auto !important; padding: 0 !important; }
          .admin-content { display: block !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          main { padding: 0 !important; background: white !important; min-height: auto !important; }
        }
      `}} />

      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/admin/orders" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: "bold" }}>← Back to Orders</Link>
        <PrintButton />
      </div>

      <div className="invoice-card" style={{ maxWidth: "800px", margin: "0 auto", background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", border: "1px solid #E2E8F0" }}>
        
        {/* Invoice Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #E2E8F0", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "28px", fontWeight: "800" }}>ORDER INVOICE</h1>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Order ID: <strong>{order.id}</strong></p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
              Status: <span style={{ 
                background: order.status === "PAID" ? "#D1FAE5" : order.status === "CANCELLED" ? "#FEE2E2" : "#FEF3C7",
                color: order.status === "PAID" ? "#065F46" : order.status === "CANCELLED" ? "#991B1B" : "#92400E",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
                marginLeft: "6px"
              }}>{order.status}</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "20px", fontWeight: "700" }}>Consortium e-Learning Network</h2>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>A-118, 1st Floor, Sector-63</p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Noida, U.P. 201301, India</p>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>info@stmjournals.com</p>
          </div>
        </div>

        {/* Two Column Info Rows */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px" }}>
          <div>
            <h3 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bill To:</h3>
            {order.organization && (
              <p style={{ margin: "0 0 4px 0", color: "#1E293B", fontSize: "16px", fontWeight: "bold" }}>{order.organization}</p>
            )}
            <p style={{ margin: "0 0 4px 0", color: "#1E293B", fontSize: "15px", fontWeight: "600" }}>{order.customerName}</p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>{order.email}</p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>{order.address}</p>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>{order.state} - {order.pincode}</p>
            {order.gstNumber && (
              <p style={{ margin: "8px 0 0 0", color: "#475569", fontSize: "14px" }}>GSTIN: <strong>{order.gstNumber}</strong></p>
            )}
          </div>

          {/* Transaction & Details */}
          <div style={{ background: "#F8FAFC", padding: "20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#0F172A", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
              💳 Transaction Details:
            </h3>
            {hasTransaction ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Gateway: <strong style={{ color: "#1E293B" }}>Razorpay India</strong>
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Payment ID: <strong style={{ color: "#1E293B", wordBreak: "break-all" }}>{order.razorpayPaymentId}</strong>
                </p>
                {order.razorpayOrderId && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                    Gateway Ref: <strong style={{ color: "#1E293B", wordBreak: "break-all" }}>{order.razorpayOrderId}</strong>
                  </p>
                )}
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
                  Timestamp: <strong style={{ color: "#1E293B" }}>{new Date(order.updatedAt).toLocaleString()}</strong>
                </p>
                <p style={{ margin: "4px 0 0 0" }}>
                  <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: "11px", fontWeight: "bold", padding: "4px 8px", borderRadius: "999px" }}>
                    TRANSACTION SUCCESS
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Payment details unavailable or pending manual confirmation.</p>
                <p style={{ margin: "10px 0 0 0" }}>
                  <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: "11px", fontWeight: "bold", padding: "4px 8px", borderRadius: "999px" }}>
                    PENDING GATEWAY HANDSHAKE
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead style={{ background: "#F8FAFC", borderBottom: "2px solid #CBD5E1" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>S.No</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Journal Details</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>HSN/SAC</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Plan</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Qty</th>
              <th style={{ padding: "12px", textAlign: "right", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Price ({order.currency})</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px", color: "#475569", fontSize: "14px" }}>{i + 1}</td>
                <td style={{ padding: "12px", color: "#0F172A", fontSize: "14px", fontWeight: "500" }}>
                  {item.journalName}
                  <div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>
                    {item.subject} {item.issn ? `| ISSN: ${item.issn}` : ''} | Year: {item.year}
                  </div>
                </td>
                <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "13px" }}>
                  {getHsnCode(item.journalName, item.subject, item.selectedPlan)}
                </td>
                <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "13px" }}>{item.selectedPlan}</td>
                <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.qty}</td>
                <td style={{ padding: "12px", textAlign: "right", color: "#0F172A", fontSize: "14px" }}>{(item.unitPrice * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#475569", fontSize: "14px" }}>
              <span>Subtotal:</span>
              <span>{order.currency} {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#16A34A", fontSize: "14px" }}>
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                <span>-{order.currency} {order.discount.toLocaleString()}</span>
              </div>
            )}
            {order.cgst > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#475569", fontSize: "13px" }}>
                <span>CGST:</span>
                <span>{order.currency} {order.cgst.toLocaleString()}</span>
              </div>
            )}
            {order.sgst > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#475569", fontSize: "13px" }}>
                <span>SGST:</span>
                <span>{order.currency} {order.sgst.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid #E2E8F0", marginTop: "8px", color: "#0F172A", fontSize: "18px", fontWeight: "bold" }}>
              <span>Total Amount Paid:</span>
              <span>{order.currency} {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Certification */}
        <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #E2E8F0", color: "#64748B", fontSize: "12px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px 0" }}>This is a computer generated Invoice confirming receipt of funds.</p>
          <p style={{ margin: 0 }}>Consortium e-Learning Network Pvt. Ltd. • All Rights Reserved.</p>
        </div>

      </div>
    </main>
  );
}
