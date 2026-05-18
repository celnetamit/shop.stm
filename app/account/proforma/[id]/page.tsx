import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import Link from "next/link";
import PrintButton from "@/app/components/print-button";

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

export default async function ProformaPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const quote = await prisma.proformaQuote.findUnique({
    where: { id: resolvedParams.id },
    include: { items: true }
  });

  if (!quote || (quote.createdByUserId !== session.sub && quote.email !== session.email)) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Proforma not found or access denied.</div>;
  }

  // Calculate Subtotal (since no total column exists in ProformaQuote, we calculate from items)
  const subtotal = quote.items.reduce((sum, item) => sum + item.unitPrice, 0);
  const discountAmount = quote.couponPercent ? (subtotal * quote.couponPercent) / 100 : 0;
  const total = subtotal - discountAmount;

  return (
    <main style={{ minHeight: "100vh", background: "#F1F5F9", padding: "40px 20px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .site-header, .site-footer, .no-print { display: none !important; }
          .invoice-card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          main { padding: 0 !important; background: white !important; }
        }
      `}} />

      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/account" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: "bold" }}>← Back to Dashboard</Link>
        <PrintButton />
      </div>

      <div className="invoice-card" style={{ maxWidth: "800px", margin: "0 auto", background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", border: "1px solid #E2E8F0" }}>
        
        {/* Invoice Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #E2E8F0", paddingBottom: "20px", marginBottom: "30px" }}>
          <div>
            <h1 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "28px" }}>PROFORMA QUOTE</h1>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Quote ID: <strong>{quote.id}</strong></p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Date: {new Date(quote.createdAt).toLocaleDateString()}</p>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>Status: <strong>{quote.status}</strong></p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "20px" }}>Consortium e-Learning Network</h2>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>A-118, 1st Floor, Sector-63</p>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Noida, U.P. 201301, India</p>
            <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>info@stmjournals.com</p>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "16px", textTransform: "uppercase" }}>Bill To:</h3>
          <p style={{ margin: "0 0 4px 0", color: "#1E293B", fontSize: "16px", fontWeight: "bold" }}>{quote.organization}</p>
          <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>Attn: {quote.contactName}</p>
          <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>{quote.email} | {quote.phone}</p>
          <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "14px" }}>{quote.address}</p>
          <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>{quote.country}</p>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead style={{ background: "#F8FAFC", borderBottom: "2px solid #CBD5E1" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "14px" }}>S.No</th>
              <th style={{ padding: "12px", textAlign: "left", color: "#334155", fontSize: "14px" }}>Item Description</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "14px" }}>HSN/SAC</th>
              <th style={{ padding: "12px", textAlign: "center", color: "#334155", fontSize: "14px" }}>Plan</th>
              <th style={{ padding: "12px", textAlign: "right", color: "#334155", fontSize: "14px" }}>Price ({quote.currency})</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px", color: "#475569", fontSize: "14px" }}>{i + 1}</td>
                <td style={{ padding: "12px", color: "#0F172A", fontSize: "14px", fontWeight: "500" }}>
                  {item.journalName}
                  <div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>{item.subject} {item.issn ? `| ISSN: ${item.issn}` : ''}</div>
                </td>
                <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>
                  {getHsnCode(item.journalName, item.subject, item.selectedPlan)}
                </td>
                <td style={{ padding: "12px", textAlign: "center", color: "#475569", fontSize: "14px" }}>{item.selectedPlan}</td>
                <td style={{ padding: "12px", textAlign: "right", color: "#0F172A", fontSize: "14px" }}>{item.unitPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#475569", fontSize: "14px" }}>
              <span>Subtotal:</span>
              <span>{quote.currency} {subtotal.toLocaleString()}</span>
            </div>
            {quote.couponPercent > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", color: "#16A34A", fontSize: "14px" }}>
                <span>Discount ({quote.couponCode} - {quote.couponPercent}%):</span>
                <span>-{quote.currency} {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid #E2E8F0", marginTop: "8px", color: "#0F172A", fontSize: "18px", fontWeight: "bold" }}>
              <span>Total Amount:</span>
              <span>{quote.currency} {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div style={{ marginTop: "50px", paddingTop: "20px", borderTop: "1px solid #E2E8F0", color: "#64748B", fontSize: "12px", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px 0" }}>This is a computer generated proforma invoice and does not require a signature.</p>
          <p style={{ margin: 0 }}>Please quote the Proforma ID when making the payment.</p>
        </div>

      </div>
    </main>
  );
}
