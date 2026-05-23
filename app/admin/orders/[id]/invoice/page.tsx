import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getJournalCatalog } from "@/lib/journal-catalog";
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

export default async function OrderInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/account");

  const resolvedParams = await params;
  const order = await prisma.order.findUnique({ where: { id: resolvedParams.id }, include: { items: true, user: true } });
  if (!order) return <div style={{ padding: "40px", textAlign: "center" }}>Order not found.</div>;

  const catalog = await getJournalCatalog();
  const isJournalsPub = order.items.some(item => {
    const cleanItemName = item.journalName.toLowerCase();
    const match = catalog.find(cat => cleanItemName.includes(cat.journalName.toLowerCase()) || cat.journalName.toLowerCase().includes(cleanItemName));
    return match && match.publisher && match.publisher.toLowerCase().replace(/[^a-z0-9]/g, "") === "journalspub";
  });

  const companyName = isJournalsPub ? "Journals Pub" : "STM Journals";
  const companyLines = isJournalsPub
    ? ["Dhruv Infosystems Private Limited", "A-118, Level 1, Sector 63, Noida - 201301", "subscriptions@journalspub.com"]
    : ["Consortium e-Learning Network Pvt. Ltd.", "A-118, 1st Floor, Sector-63, Noida - 201301", "subscriptions@stmjournals.com"];

  return (
    <SharedInvoiceLayout
      backHref="/admin/orders"
      backLabel="Back to Orders"
      title={order.cgst > 0 || order.sgst > 0 ? "TAX INVOICE" : "ORDER INVOICE"}
      numberLabel="Invoice / Order Number"
      numberValue={order.id}
      dateValue={new Date(order.createdAt).toLocaleDateString("en-IN")}
      statusValue={order.status}
      companyName={companyName}
      companyLines={companyLines}
      billToLines={[order.organization || order.customerName, order.customerName, order.email, order.address, `${order.state}${order.pincode ? ` - ${order.pincode}` : ""}`, `GSTIN: ${order.gstNumber || "N/A"}`]}
      metaPanel={<div style={{ fontSize: "13px", color: "#64748B" }}><p style={{ margin: "0 0 6px 0" }}>Payment ID: {order.razorpayPaymentId || "Manual"}</p><p style={{ margin: "0 0 6px 0" }}>Razorpay Order: {order.razorpayOrderId || "Direct"}</p><p style={{ margin: 0 }}>Last Updated: {new Date(order.updatedAt).toLocaleString("en-IN")}</p></div>}
      tableHeader={<tr><th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>S.No</th><th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Particulars</th><th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>HSN/SAC</th><th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Plan</th><th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Qty</th><th style={{ padding: "12px", textAlign: "right", color: "#334155", fontSize: "13px", fontWeight: "bold" }}>Amount ({order.currency})</th></tr>}
      tableBody={<>{order.items.map((item, idx) => (<tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}><td style={{ padding: "12px", color: "#475569", fontSize: "14px" }}>{idx + 1}</td><td style={{ padding: "12px", color: "#0F172A", fontSize: "14px", fontWeight: "500" }}>{item.journalName}<div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>Year: {item.year} | {item.selectedPlan}</div></td><td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "13px" }}>{getHsnCode(item.journalName, item.subject || "", item.selectedPlan)}</td><td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "13px" }}>{item.selectedPlan}</td><td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.qty || 1}</td><td style={{ padding: "12px", textAlign: "right", color: "#0F172A", fontSize: "14px" }}>{(item.unitPrice * (item.qty || 1)).toFixed(2)}</td></tr>))}</>}
      totals={[
        { label: "Subtotal:", value: `${order.currency} ${Number(order.subtotal).toFixed(2)}` },
        ...(order.discount > 0 ? [{ label: "Discount:", value: `-${order.currency} ${Number(order.discount).toFixed(2)}`, tone: "success" as const }] : []),
        ...(order.cgst > 0 ? [{ label: "CGST (9%):", value: `${order.currency} ${Number(order.cgst).toFixed(2)}` }] : []),
        ...(order.sgst > 0 ? [{ label: "SGST (9%):", value: `${order.currency} ${Number(order.sgst).toFixed(2)}` }] : []),
        { label: "Total:", value: `${order.currency} ${Number(order.total).toFixed(2)}`, tone: "strong" }
      ]}
      footerNote={order.adminRemarks ? `Admin Note: ${order.adminRemarks}` : "This is a computer generated invoice."}
    />
  );
}
