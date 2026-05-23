import { prisma } from "@/lib/prisma";
import { createSimplePdf } from "@/lib/simple-pdf";
import { formatPiNumber } from "@/lib/pi-number";

export async function buildProformaPdfAttachment(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({
    where: { id: quoteId },
    include: { items: true }
  });
  if (!quote) return null;

  const piNo = formatPiNumber({ id: quote.id, createdAt: quote.createdAt });
  const lines: string[] = [
    "A Division of Consortium e-Learning Network Pvt. Ltd.",
    `PI Number: ${piNo}`,
    `Date: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}`,
    `Organization: ${quote.organization}`,
    `Contact: ${quote.contactName}`,
    `Email: ${quote.email}`,
    `Phone: ${quote.phone}`,
    `Currency: ${quote.currency}`,
    `Status: ${quote.status}`,
    "",
    "Selected Journals:"
  ];

  let subtotal = 0;
  for (const it of quote.items) {
    subtotal += Number(it.unitPrice || 0);
    lines.push(`- ${it.journalName} | Plan: ${it.selectedPlan} | Amount: ${quote.currency} ${Number(it.unitPrice || 0).toFixed(2)}`);
  }

  const discount = Math.round((subtotal * (quote.couponPercent || 0)) / 100);
  const taxable = subtotal - discount;
  const gst = quote.currency === "INR" ? Math.round(taxable * 0.18) : 0;
  const total = taxable + gst;

  lines.push("");
  lines.push(`Subtotal: ${quote.currency} ${subtotal.toFixed(2)}`);
  lines.push(`Discount: ${quote.currency} ${discount.toFixed(2)}`);
  lines.push(`Tax: ${quote.currency} ${gst.toFixed(2)}`);
  lines.push(`Grand Total: ${quote.currency} ${total.toFixed(2)}`);

  const buffer = createSimplePdf(`PROFORMA INVOICE - ${piNo}`, lines);
  return {
    filename: `proforma-${piNo}.pdf`,
    contentType: "application/pdf",
    data: buffer
  };
}

export async function buildOrderPdfAttachment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!order) return null;

  const lines: string[] = [
    "A Division of Consortium e-Learning Network Pvt. Ltd.",
    `Order ID: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.email}`,
    `Currency: ${order.currency}`,
    `Status: ${order.status}`,
    "",
    "Items:"
  ];

  for (const it of order.items) {
    const amount = Number(it.unitPrice || 0) * Number(it.qty || 1);
    lines.push(`- ${it.journalName} | Plan: ${it.selectedPlan} | Qty: ${it.qty} | Amount: ${order.currency} ${amount.toFixed(2)}`);
  }

  lines.push("");
  lines.push(`Subtotal: ${order.currency} ${Number(order.subtotal || 0).toFixed(2)}`);
  lines.push(`Discount: ${order.currency} ${Number(order.discount || 0).toFixed(2)}`);
  lines.push(`CGST: ${order.currency} ${Number(order.cgst || 0).toFixed(2)}`);
  lines.push(`SGST: ${order.currency} ${Number(order.sgst || 0).toFixed(2)}`);
  lines.push(`Grand Total: ${order.currency} ${Number(order.total || 0).toFixed(2)}`);

  const buffer = createSimplePdf(`TAX INVOICE - ${order.id}`, lines);
  return {
    filename: `invoice-${order.id}.pdf`,
    contentType: "application/pdf",
    data: buffer
  };
}
