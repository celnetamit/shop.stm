import { prisma } from "@/lib/prisma";
import { formatPiNumber } from "@/lib/pi-number";

export async function prepareProformaEmailPayload(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({
    where: { id: quoteId },
    include: { items: true, createdBy: true }
  });

  if (!quote) return null;

  const { getJournalCatalog } = await import("@/lib/journal-catalog");
  const catalog = await getJournalCatalog();
  const catalogMap = new Map(catalog.map((c) => [Number(c.id), c]));
  const isJournalsPub = quote.items.some((it) => {
    const item = catalogMap.get(it.serialNo);
    return item?.publisher?.toLowerCase() === "journalspub";
  });

  const appliedDiscountPercent = quote.couponPercent || 0;
  const currency = quote.currency || "INR";
  const symbol = currency === "INR" ? "₹" : "$";

  let calcSubtotal = 0;
  let calcDiscountAmt = 0;
  let calcTaxable = 0;
  let calcCgst = 0;
  let calcSgst = 0;

  quote.items.forEach((it) => {
    const unitPrice = it.unitPrice;
    const itemDiscount = (unitPrice * appliedDiscountPercent) / 100;
    const itemTaxable = unitPrice - itemDiscount;

    const isDigital = it.selectedPlan === "ONLINE" || it.selectedPlan === "PRINT_ONLINE";
    const isINR = currency === "INR";
    
    let isGstExempt = true;
    if (quote.createdBy) {
      if (quote.createdBy.role === "LIBRARIAN" || quote.createdBy.role === "USER") {
        isGstExempt = true;
      } else if (
        quote.createdBy.role === "AGENCY" ||
        quote.createdBy.role === "STUDENT" ||
        quote.createdBy.role === "SCHOLAR"
      ) {
        isGstExempt = false;
      } else {
        isGstExempt = false;
      }
    } else {
      isGstExempt = quote.subscriberCategory === "COLLEGE" || quote.subscriberCategory === "EXISTING_PI";
    }

    const itemGstRate = isINR && isDigital && !isGstExempt ? 18 : 0;

    const itemGst = itemTaxable * (itemGstRate / 100);
    const itemCgst = itemGst / 2;
    const itemSgst = itemGst / 2;

    calcSubtotal += unitPrice;
    calcDiscountAmt += itemDiscount;
    calcTaxable += itemTaxable;
    calcCgst += itemCgst;
    calcSgst += itemSgst;
  });

  const subtotal = Math.round(calcSubtotal * 100) / 100;
  const discount = Math.round(calcDiscountAmt * 100) / 100;
  const taxable = Math.round(calcTaxable * 100) / 100;
  const cgst = Math.round(calcCgst * 100) / 100;
  const sgst = Math.round(calcSgst * 100) / 100;
  const grandTotal = Math.round((taxable + cgst + sgst) * 100) / 100;

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
        <td style="padding:10px; font-weight:bold; color:#334155;">${it.journalName}</td>
        <td style="padding:10px; color:#64748b;">${hsn}</td>
        <td style="padding:10px;"><span style="background-color:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${it.selectedPlan}</span></td>
        <td style="padding:10px; text-align:right; font-weight:bold; color:#0f172a;">${symbol}${Number(it.unitPrice).toFixed(2)}</td>
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
        <td style="text-align:right; color:#64748b;">Discount (${quote.couponCode || 'Coupon'}):</td>
        <td style="text-align:right; color:#ef4444; font-weight:600;">-${symbol}${Number(discount).toFixed(2)}</td>
      </tr>
    `;
  }

  if (currency === "INR" && (cgst > 0 || sgst > 0)) {
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
    quoteId: formatPiNumber({ id: quote.id, createdAt: quote.createdAt }),
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
