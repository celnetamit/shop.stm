import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatPiNumber } from "@/lib/pi-number";
import SharedInvoiceLayout from "@/app/components/invoice/shared-invoice-layout";

export const dynamic = "force-dynamic";

function isBookProduct(journalName: string | null | undefined, subject: string | null | undefined): boolean {
  const lowerName = (journalName ?? "").toLowerCase();
  const lowerSubject = (subject ?? "").toLowerCase();
  return lowerSubject.includes("book") || lowerSubject.includes("monograph") || lowerName.includes("book") || lowerName.includes("monograph");
}

function getHsnCode(journalName: string, subject: string, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE"): string {
  if (plan === "ONLINE") return "998431";
  return isBookProduct(journalName, subject) ? "4901" : "4902";
}

export default async function ProformaPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const quote = await prisma.proformaQuote.findUnique({ where: { id: resolvedParams.id }, include: { items: true } });

  if (!quote || (quote.createdByUserId !== session.sub && quote.email.toLowerCase() !== session.email.toLowerCase())) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Proforma not found or access denied.</div>;
  }

  const subtotal = quote.items.reduce((sum, item) => sum + item.unitPrice, 0);
  const discountAmount = quote.couponPercent ? (subtotal * quote.couponPercent) / 100 : 0;
  const isDigital = quote.items.some((item) => item.selectedPlan === "ONLINE" || item.selectedPlan === "PRINT_ONLINE");
  const gstRate = quote.currency === "INR" && isDigital ? 18 : 0;
  const taxable = subtotal - discountAmount;
  const gst = (taxable * gstRate) / 100;
  const total = taxable + gst;
  const piNumber = formatPiNumber({ id: quote.id, createdAt: quote.createdAt });

  return (
    <SharedInvoiceLayout
      backHref="/account"
      backLabel="Back to Dashboard"
      title="PROFORMA QUOTE"
      numberLabel="PI Number"
      numberValue={piNumber}
      dateValue={new Date(quote.createdAt).toLocaleDateString()}
      statusValue={quote.status}
      companyName="Consortium e-Learning Network"
      companyLines={["A Division of Consortium e-Learning Network Pvt. Ltd.", "A-118, 1st Floor, Sector-63", "Noida, U.P. 201301, India", "info@stmjournals.com"]}
      billToLines={[
        quote.organization || "N/A",
        `Attn: ${quote.contactName || "N/A"}`,
        `${quote.email} | ${quote.phone || "N/A"}`,
        quote.address || "N/A",
        quote.country || "N/A"
      ]}
      metaPanel={<p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>Proforma generated for institutional processing.</p>}
      tableHeader={
        <tr>
          <th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "14px" }}>S.No</th>
          <th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "14px" }}>Item Description</th>
          <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "14px" }}>HSN/SAC</th>
          <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "14px" }}>Plan</th>
          <th style={{ padding: "12px", textAlign: "right", color: "#334155", fontSize: "14px" }}>Price ({quote.currency})</th>
        </tr>
      }
      tableBody={
        <>
          {quote.items.map((item, i) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
              <td style={{ padding: "12px", color: "#475569", fontSize: "14px" }}>{i + 1}</td>
              <td style={{ padding: "12px", color: "#0F172A", fontSize: "14px", fontWeight: "500" }}>{item.journalName}<div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>{item.subject}</div></td>
              <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{getHsnCode(item.journalName, item.subject, item.selectedPlan)}</td>
              <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.selectedPlan}</td>
              <td style={{ padding: "12px", textAlign: "right", color: "#0F172A", fontSize: "14px" }}>{item.unitPrice.toLocaleString()}</td>
            </tr>
          ))}
        </>
      }
      totals={[
        { label: "Subtotal:", value: `${quote.currency} ${subtotal.toLocaleString()}` },
        ...(quote.couponPercent > 0 ? [{ label: `Discount (${quote.couponCode} - ${quote.couponPercent}%):`, value: `-${quote.currency} ${discountAmount.toLocaleString()}`, tone: "success" as const }] : []),
        ...(gst > 0 ? [{ label: `GST (${gstRate}%):`, value: `${quote.currency} ${gst.toLocaleString()}` }] : []),
        { label: "Total Amount:", value: `${quote.currency} ${total.toLocaleString()}`, tone: "strong" }
      ]}
      footerNote={`This is a computer generated proforma invoice. Please quote PI Number (${piNumber}) while making payment.`}
    />
  );
}
