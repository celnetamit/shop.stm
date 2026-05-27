import { prisma } from "@/lib/prisma";
import { createSimplePdf } from "@/lib/simple-pdf";
import { formatPiNumber } from "@/lib/pi-number";

export async function buildProformaPdfAttachment(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote) return null;

  const piNo = formatPiNumber({ id: quote.id, createdAt: quote.createdAt });
  const subtotal = quote.items.reduce((s, i) => s + Number(i.unitPrice || 0), 0);
  const discount = Math.round((subtotal * (quote.couponPercent || 0)) / 100);
  const taxable = subtotal - discount;
  const gst = quote.currency === "INR" ? Math.round(taxable * 0.18) : 0;
  const total = taxable + gst;

  const lines: string[] = [
    `PROFORMA INVOICE - ${piNo}`,
    `Date: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}`,
    `Status: ${quote.status}`,
    `Customer: ${quote.contactName}`,
    `Institution: ${quote.organization}`,
    `Email: ${quote.email}`,
    `Address: ${quote.address || "N/A"}`,
    `Receiver: ${quote.sameAsBilling ? quote.contactName : (quote.receiverName || quote.contactName)}`,
    `Receiver Address: ${quote.sameAsBilling ? (quote.address || "N/A") : (quote.receiverAddress || quote.address || "N/A")}`,
    "",
    "Items:"
  ];

  quote.items.forEach((it, idx) => {
    lines.push(`${idx + 1}. ${it.journalName} | ${it.selectedPlan} | ${quote.currency} ${Number(it.unitPrice || 0).toFixed(2)}`);
  });

  lines.push("");
  lines.push(`Subtotal: ${quote.currency} ${subtotal.toFixed(2)}`);
  lines.push(`Discount: ${quote.currency} ${discount.toFixed(2)}`);
  lines.push(`GST: ${quote.currency} ${gst.toFixed(2)}`);
  lines.push(`Total: ${quote.currency} ${total.toFixed(2)}`);

  return {
    filename: `proforma-${piNo}.pdf`,
    contentType: "application/pdf",
    data: createSimplePdf(`PROFORMA ${piNo}`, lines)
  };
}

export async function buildOrderPdfAttachment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const cgst = Number(order.cgst || 0);
  const sgst = Number(order.sgst || 0);
  const total = Number(order.total || 0);

  const lines: string[] = [
    `TAX INVOICE - ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
    `Status: ${order.status}`,
    `Customer: ${order.customerName}`,
    `Institution: ${order.organization || "N/A"}`,
    `Email: ${order.email}`,
    `Address: ${order.address}, ${order.state} - ${order.pincode}`,
    `Receiver: ${order.sameAsBilling ? order.customerName : (order.receiverName || order.customerName)}`,
    `Receiver Address: ${order.sameAsBilling ? order.address : (order.receiverAddress || order.address)}`,
    "",
    "Items:"
  ];

  order.items.forEach((it, idx) => {
    const qty = Number(it.qty || 1);
    const amount = Number(it.unitPrice || 0) * qty;
    lines.push(`${idx + 1}. ${it.journalName} | ${it.selectedPlan} | Qty ${qty} | ${order.currency} ${amount.toFixed(2)}`);
  });

  lines.push("");
  lines.push(`Subtotal: ${order.currency} ${subtotal.toFixed(2)}`);
  lines.push(`Discount: ${order.currency} ${discount.toFixed(2)}`);
  lines.push(`CGST: ${order.currency} ${cgst.toFixed(2)}`);
  lines.push(`SGST: ${order.currency} ${sgst.toFixed(2)}`);
  lines.push(`Total: ${order.currency} ${total.toFixed(2)}`);

  return {
    filename: `invoice-${order.id}.pdf`,
    contentType: "application/pdf",
    data: createSimplePdf(`INVOICE ${order.id}`, lines)
  };
}
