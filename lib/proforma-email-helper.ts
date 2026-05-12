import { prisma } from "@/lib/prisma";

export async function prepareProformaEmailPayload(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({
    where: { id: quoteId },
    include: { items: true }
  });

  if (!quote) return null;

  const subtotal = quote.items.reduce((sum, item) => sum + item.unitPrice, 0);
  const discount = Math.round((subtotal * (quote.couponPercent || 0)) / 100);
  const taxable = subtotal - discount;
  
  // Traditional Indian GST split logic used elsewhere in app
  const cgst = Math.round(taxable * 0.09 * 10) / 10;
  const sgst = Math.round(taxable * 0.09 * 10) / 10;
  const grandTotal = Math.round((taxable + cgst + sgst) * 10) / 10;

  const currency = quote.currency || "INR";
  const symbol = currency === "INR" ? "₹" : "$";

  // 1. Generate Visual HTML Breakdown Table
  let itemsHtml = `
    <table style="width:100%; border-collapse:collapse; font-size:13px; margin: 20px 0;" cellpadding="8">
      <thead>
        <tr style="background-color:#f1f5f9; color:#475569; border-bottom:2px solid #e2e8f0; text-align:left;">
          <th style="padding:10px;">#</th>
          <th style="padding:10px;">Journal Name</th>
          <th style="padding:10px;">Plan</th>
          <th style="padding:10px; text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
  `;

  quote.items.forEach((it, idx) => {
    itemsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding:10px; color:#64748b;">${idx + 1}</td>
        <td style="padding:10px; font-weight:bold; color:#334155;">${it.journalName}</td>
        <td style="padding:10px;"><span style="background-color:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${it.selectedPlan}</span></td>
        <td style="padding:10px; text-align:right; font-weight:bold; color:#0f172a;">${symbol}${it.unitPrice.toLocaleString()}</td>
      </tr>
    `;
  });

  itemsHtml += `</tbody></table>`;

  // 2. Generate Financial Ledger Summary Table
  let financialsHtml = `
    <table style="width: 100%; margin-top: 15px; border-top: 2px solid #e2e8f0;" cellpadding="6">
      <tr>
        <td style="text-align:right; color:#64748b;">Subtotal:</td>
        <td style="text-align:right; width:120px; font-weight:600; color:#0f172a;">${symbol}${subtotal.toLocaleString()}</td>
      </tr>
  `;

  if (discount > 0) {
    financialsHtml += `
      <tr>
        <td style="text-align:right; color:#64748b;">Discount (${quote.couponCode || 'Coupon'}):</td>
        <td style="text-align:right; color:#ef4444; font-weight:600;">-${symbol}${discount.toLocaleString()}</td>
      </tr>
    `;
  }

  financialsHtml += `
      <tr>
        <td style="text-align:right; color:#64748b;">CGST (9%):</td>
        <td style="text-align:right; font-weight:600; color:#0f172a;">${symbol}${cgst.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="text-align:right; color:#64748b;">SGST (9%):</td>
        <td style="text-align:right; font-weight:600; color:#0f172a;">${symbol}${sgst.toLocaleString()}</td>
      </tr>
      <tr style="background-color:#f8fafc; font-size:16px;">
        <td style="text-align:right; padding:12px; font-weight:bold; color:#0f2a57;">Grand Total:</td>
        <td style="text-align:right; padding:12px; font-weight:bold; color:#16a34a;">${symbol}${grandTotal.toLocaleString()}</td>
      </tr>
    </table>
  `;

  return {
    quoteId: quote.id,
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
    financialsHtml: financialsHtml
  };
}
