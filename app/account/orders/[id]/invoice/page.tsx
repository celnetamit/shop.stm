import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SharedInvoiceLayout from "@/app/components/invoice/shared-invoice-layout";

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

export default async function CustomerOrderInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const order = await prisma.order.findUnique({ where: { id: resolvedParams.id }, include: { items: true, user: true } });

  if (!order) return <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>Order not found.</div>;

  const isOwner = order.userId === session.sub || order.email.toLowerCase() === session.email.toLowerCase();
  if (!isOwner) {
    return <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif", color: "#EF4444" }}><h3>Access Denied</h3><p>You do not have permission to access this order invoice.</p><Link href="/account" style={{ color: "#2563EB", fontWeight: "bold" }}>Return to Dashboard</Link></div>;
  }

  return (
    <SharedInvoiceLayout
      backHref="/account"
      backLabel="Back to Dashboard"
      title="PAID INVOICE"
      numberLabel="Order ID"
      numberValue={order.id}
      dateValue={new Date(order.createdAt).toLocaleDateString()}
      statusValue={order.status}
      companyName="Consortium e-Learning Network"
      companyLines={["A-118, 1st Floor, Sector-63", "Noida, U.P. 201301, India", "info@stmjournals.com"]}
      billToLines={[order.organization || order.customerName, order.customerName, order.email, order.address, `${order.state} - ${order.pincode}`]}
      metaPanel={<div style={{ fontSize: "13px", color: "#64748B" }}><p style={{ margin: "0 0 6px 0" }}>Payment Gateway: Razorpay India</p><p style={{ margin: "0 0 6px 0" }}>Payment ID: {order.razorpayPaymentId || "Manual Confirmation"}</p><p style={{ margin: 0 }}>Updated: {new Date(order.updatedAt).toLocaleString()}</p></div>}
      tableHeader={<tr><th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>S.No</th><th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Journal Details</th><th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>HSN/SAC</th><th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Plan</th><th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Qty</th><th style={{ padding: "12px", textAlign: "right", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Price ({order.currency})</th></tr>}
      tableBody={<>{order.items.map((item, i) => (<tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}><td style={{ padding: "12px", color: "#475569", fontSize: "14px" }}>{i + 1}</td><td style={{ padding: "12px", color: "#0F172A", fontSize: "14px", fontWeight: "500" }}>{item.journalName}<div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>{item.subject} | Year: {item.year}</div></td><td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "13px" }}>{getHsnCode(item.journalName, item.subject, item.selectedPlan)}</td><td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "13px" }}>{item.selectedPlan}</td><td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.qty}</td><td style={{ padding: "12px", textAlign: "right", color: "#0F172A", fontSize: "14px" }}>{(item.unitPrice * item.qty).toLocaleString()}</td></tr>))}</>}
      totals={[
        { label: "Subtotal:", value: `${order.currency} ${order.subtotal.toLocaleString()}` },
        ...(order.discount > 0 ? [{ label: `Discount${order.couponCode ? ` (${order.couponCode})` : ""}:`, value: `-${order.currency} ${order.discount.toLocaleString()}`, tone: "success" as const }] : []),
        ...(order.cgst > 0 ? [{ label: "CGST:", value: `${order.currency} ${order.cgst.toLocaleString()}` }] : []),
        ...(order.sgst > 0 ? [{ label: "SGST:", value: `${order.currency} ${order.sgst.toLocaleString()}` }] : []),
        { label: "Total Amount Paid:", value: `${order.currency} ${order.total.toLocaleString()}`, tone: "strong" }
      ]}
      footerNote="This is a computer generated invoice confirming receipt of funds."
    />
  );
}
