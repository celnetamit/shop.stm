import { prisma } from "@/lib/prisma";
import { resolvePiNumber } from "@/lib/pi-number";
import { quoteTotals } from "@/lib/pricing";

// Escape user-controlled values before interpolating into email HTML. journalName,
// selectedPlan, couponCode etc. originate from request bodies and must never be
// injected raw (lib/email.ts deliberately skips escaping for *Html data keys).
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function prepareProformaEmailPayload(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({
    where: { id: quoteId },
    include: { items: true }
  });

  if (!quote) return null;

  const { getJournalCatalog } = await import("@/lib/journal-catalog");
  const catalog = await getJournalCatalog();
  const catalogMap = new Map(catalog.map((c) => [Number(c.id), c]));
  const isJournalsPub = quote.items.some((it) => {
    const item = catalogMap.get(it.serialNo);
    return item?.publisher?.toLowerCase() === "journalspub";
  });

  const currency = quote.currency || "INR";
  const symbol = currency === "INR" ? "₹" : "$";

  // Single source of truth for the money math (see lib/pricing.ts).
  const { subtotal, discount, cgst, sgst, total: grandTotal } = quoteTotals(quote);

  // 1. Generate Visual HTML Breakdown Table
  let itemsHtml = `
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin: 20px 0;" cellpadding="8">
      <thead>
        <tr style="background-color:#f1f5f9; color:#475569; border-bottom:2px solid #e2e8f0; text-align:left;">
          <th style="padding:10px;">#</th>
          <th style="padding:10px;">Journal Name</th>
          <th style="padding:10px;">HSN</th>
          <th style="padding:10px;">Plan</th>
          <th style="padding:10px; text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
  `;

  quote.items.forEach((it, idx) => {
    const isBook = isBookProduct(it.journalName, it.subject);
    const hsn = it.selectedPlan === "ONLINE"
      ? "998431"
      : (isBook ? "4901" : "4902");
    itemsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding:10px; color:#64748b;">${idx + 1}</td>
        <td style="padding:10px; font-weight:bold; color:#334155;">${esc(it.journalName)}</td>
        <td style="padding:10px; color:#64748b;">${esc(hsn)}</td>
        <td style="padding:10px;"><span style="background-color:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${esc(it.selectedPlan)}</span></td>
        <td style="padding:10px; text-align:right; font-weight:bold; color:#0f172a;">${symbol}${(Number(it.unitPrice) || 0).toFixed(2)}</td>
      </tr>
    `;
  });

  itemsHtml += `</tbody></table>`;

  // 2. Generate Financial Ledger Summary Table
  let financialsHtml = `
    <table style="width: 100%; margin-top: 15px; border-top: 2px solid #e2e8f0;" cellpadding="6">
      <tr>
        <td style="text-align:right; color:#64748b;">Subtotal:</td>
        <td style="text-align:right; width:120px; font-weight:600; color:#0f172a;">${symbol}${Number(subtotal).toFixed(2)}</td>
      </tr>
  `;

  if (discount > 0) {
    financialsHtml += `
      <tr>
        <td style="text-align:right; color:#64748b;">Discount (${esc(quote.couponCode || 'Coupon')}):</td>
        <td style="text-align:right; color:#ef4444; font-weight:600;">-${symbol}${Number(discount).toFixed(2)}</td>
      </tr>
    `;
  }

  if (currency === "INR") {
    financialsHtml += `
        <tr>
          <td style="text-align:right; color:#64748b;">CGST (9%):</td>
          <td style="text-align:right; font-weight:600; color:#0f172a;">${symbol}${Number(cgst).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="text-align:right; color:#64748b;">SGST (9%):</td>
          <td style="text-align:right; font-weight:600; color:#0f172a;">${symbol}${Number(sgst).toFixed(2)}</td>
        </tr>
    `;
  }

  financialsHtml += `
      <tr style="background-color:#f8fafc; font-size:16px;">
        <td style="text-align:right; padding:12px; font-weight:bold; color:#0f2a57;">Grand Total:</td>
        <td style="text-align:right; padding:12px; font-weight:bold; color:#16a34a;">${symbol}${Number(grandTotal).toFixed(2)}</td>
      </tr>
    </table>
  `;

  return {
    quoteId: resolvePiNumber(quote),
    quoteDbId: quote.id,
    organization: quote.organization,
    contactName: quote.contactName,
    email: quote.email,
    phone: quote.phone || "N/A",
    currency,
    subtotal: `${symbol}${subtotal.toLocaleString()}`,
    discount: `${symbol}${discount.toLocaleString()}`,
    couponUsed: quote.couponCode ? `${quote.couponCode} (${quote.couponPercent}%)` : "None",
    total: `${symbol}${grandTotal.toLocaleString()}`,
    itemsTableHtml: itemsHtml,
    financialsHtml: financialsHtml,
    isJournalsPub: isJournalsPub ? "true" : "false"
  };
}

function isBookProduct(journalName: string | null | undefined, subject: string | null | undefined): boolean {
  const lowerName = (journalName ?? "").toLowerCase();
  const lowerSubject = (subject ?? "").toLowerCase();
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
