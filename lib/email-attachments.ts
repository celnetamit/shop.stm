import { prisma } from "@/lib/prisma";
import { formatPiNumber } from "@/lib/pi-number";

function htmlShell(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title></head><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:20px;">${body}</body></html>`;
}

function wrapCard(content: string) {
  return `<div style="max-width:900px;margin:0 auto;background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:18px;">${content}</div>`;
}

export async function buildProformaPdfAttachment(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote) return null;

  const piNo = formatPiNumber({ id: quote.id, createdAt: quote.createdAt });
  const subtotal = quote.items.reduce((s, i) => s + Number(i.unitPrice || 0), 0);
  const discount = Math.round((subtotal * (quote.couponPercent || 0)) / 100);
  const taxable = subtotal - discount;
  const gst = quote.currency === "INR" ? Math.round(taxable * 0.18) : 0;
  const total = taxable + gst;

  const rows = quote.items.map((it, idx) => `<tr><td>${idx + 1}</td><td>${it.journalName}<div style="color:#64748b;font-size:12px;">${it.subject}</div></td><td>${it.selectedPlan}</td><td style="text-align:right;">${quote.currency} ${Number(it.unitPrice).toFixed(2)}</td></tr>`).join("");

  const receiverName = quote.sameAsBilling ? quote.contactName : (quote.receiverName || quote.contactName);
  const receiverAddress = quote.sameAsBilling ? (quote.address || "N/A") : (quote.receiverAddress || quote.address || "N/A");

  const html = htmlShell(`Proforma ${piNo}`, wrapCard(`
    <h2 style="margin:0 0 8px;color:#0f172a;">PROFORMA INVOICE</h2>
    <p style="margin:0 0 16px;color:#475569;">PI Number: <strong>${piNo}</strong> | Date: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div><strong>Bill To</strong><div>${quote.organization}</div><div>${quote.contactName}</div><div>${quote.email}</div><div>${quote.address || "N/A"}</div></div>
      <div><strong>Receiver Details</strong><div>${receiverName}</div><div>${receiverAddress}</div><div>${quote.sameAsBilling ? (quote.phone || "N/A") : (quote.receiverPhone || quote.phone || "N/A")}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;" border="1" cellpadding="8"><thead><tr><th>#</th><th>Journal</th><th>Plan</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="margin-top:12px;text-align:right;line-height:1.6;">
      <div>Subtotal: ${quote.currency} ${subtotal.toFixed(2)}</div>
      <div>Discount: ${quote.currency} ${discount.toFixed(2)}</div>
      <div>GST: ${quote.currency} ${gst.toFixed(2)}</div>
      <div><strong>Total: ${quote.currency} ${total.toFixed(2)}</strong></div>
    </div>
  `));

  return {
    filename: `proforma-${piNo}.html`,
    contentType: "text/html",
    data: Buffer.from(html, "utf8")
  };
}

export async function buildOrderPdfAttachment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;

  const rows = order.items.map((it, idx) => `<tr><td>${idx + 1}</td><td>${it.journalName}<div style="color:#64748b;font-size:12px;">${it.subject}</div></td><td>${it.selectedPlan}</td><td>${it.qty}</td><td style="text-align:right;">${order.currency} ${(Number(it.unitPrice || 0) * Number(it.qty || 1)).toFixed(2)}</td></tr>`).join("");

  const receiverName = order.sameAsBilling ? order.customerName : (order.receiverName || order.customerName);
  const receiverAddress = order.sameAsBilling ? order.address : (order.receiverAddress || order.address);

  const html = htmlShell(`Invoice ${order.id}`, wrapCard(`
    <h2 style="margin:0 0 8px;color:#0f172a;">INVOICE</h2>
    <p style="margin:0 0 16px;color:#475569;">Order: <strong>${order.id}</strong> | Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div><strong>Bill To</strong><div>${order.organization || order.customerName}</div><div>${order.customerName}</div><div>${order.email}</div><div>${order.address}</div></div>
      <div><strong>Receiver Details</strong><div>${receiverName}</div><div>${receiverAddress}</div><div>${order.sameAsBilling ? "Same as billing" : (order.receiverPhone || "N/A")}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;" border="1" cellpadding="8"><thead><tr><th>#</th><th>Journal</th><th>Plan</th><th>Qty</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="margin-top:12px;text-align:right;line-height:1.6;">
      <div>Subtotal: ${order.currency} ${Number(order.subtotal).toFixed(2)}</div>
      <div>Discount: ${order.currency} ${Number(order.discount).toFixed(2)}</div>
      <div>CGST: ${order.currency} ${Number(order.cgst).toFixed(2)}</div>
      <div>SGST: ${order.currency} ${Number(order.sgst).toFixed(2)}</div>
      <div><strong>Total: ${order.currency} ${Number(order.total).toFixed(2)}</strong></div>
    </div>
  `));

  return {
    filename: `invoice-${order.id}.html`,
    contentType: "text/html",
    data: Buffer.from(html, "utf8")
  };
}
