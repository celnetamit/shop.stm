import { prisma } from "@/lib/prisma";
import { formatPiNumber } from "@/lib/pi-number";
import { getJournalCatalog } from "@/lib/journal-catalog";

type Brand = {
  title: string;
  subtitle: string;
  address: string;
  bankName: string;
  bankAddress: string;
  accountNumber: string;
  ifscCode: string;
  swiftCode: string;
  accountHolder: string;
  gstin: string;
  pan: string;
  cin: string;
  legalName: string;
  iecCode: string;
  email: string;
};

function getBrand(isJournalsPub: boolean): Brand {
  if (isJournalsPub) {
    return {
      title: "JOURNALS PUB",
      subtitle: "A Division of Dhruv Infosystems Private Limited",
      address: "A-118, 2nd Floor, A-Block, Sector-63, Noida - 201301, INDIA.",
      bankName: "HDFC Bank",
      bankAddress: "Sector-62, Noida, U.P., India",
      accountNumber: "03942000001077",
      ifscCode: "HDFC0002649",
      swiftCode: "HDFCINBBXXX",
      accountHolder: "Dhruv Infosystems Private Limited",
      gstin: "09AACCD1689F2ZJ",
      pan: "AACCD1689F",
      cin: "U74999DL2005PTC136381",
      legalName: "Dhruv Infosystems Private Limited",
      iecCode: "AACCD1689F",
      email: "Info@journalspub.com"
    };
  }
  return {
    title: "STM JOURNALS",
    subtitle: "A Division of Consortium e-Learning Network Pvt. Ltd.",
    address: "A-118, 1st Floor, A-Block, Sector-63, Noida - 201301, INDIA.",
    bankName: "HDFC Bank",
    bankAddress: "Sector-62, Noida, U.P., India",
    accountNumber: "03942000001153",
    ifscCode: "HDFC0002649",
    swiftCode: "HDFCINBBXXX",
    accountHolder: "Consortium eLearning Network Pvt. Ltd.",
    gstin: "09AACCC6494M1Z1",
    pan: "AACCC6494M",
    cin: "U80302DL2005PTC138759",
    legalName: "Consortium e-Learning Network Pvt. Ltd.",
    iecCode: "AACCC6494M",
    email: "info@stmjournals.in"
  };
}

function shell(title: string, content: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:Inter,Arial,sans-serif;background:#f1f5f9;padding:18px;">${content}</body></html>`;
}

function wrapInvoice(body: string) {
  return `<article style="background:#fff;max-width:900px;margin:0 auto;padding:24px;border:1px solid #cbd5e1;"><div style="border:1px solid #94a3b8;padding:1px;">${body}</div></article>`;
}

function headerBlock(brand: Brand, title: string) {
  return `
  <div style="display:flex;align-items:center;border-bottom:1px solid #94a3b8;padding:15px 20px;">
    <div style="width:15%;display:flex;justify-content:center;"><img src="${brand.title.includes("JOURNALS PUB") ? "https://shop.stmjournals.in/journalspub-logo.png" : "https://shop.stmjournals.in/stmlogo.png"}" style="max-height:65px;"/></div>
    <div style="width:85%;text-align:center;padding-right:10%;">
      <h1 style="font-size:34px;margin:0;color:#0f172a;">${brand.title}</h1>
      <p style="font-size:12px;margin:4px 0;color:#334155;">${brand.subtitle}</p>
      <p style="font-size:11px;margin:0;font-weight:700;">${title}</p>
      <p style="font-size:11px;color:#64748b;margin:2px 0 0;">${brand.address}</p>
    </div>
  </div>`;
}

function metaPanel(brand: Brand, noLabel: string, noValue: string, date: string, status: string) {
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #94a3b8;">
    <div style="padding:12px 15px;border-right:1px solid #94a3b8;font-size:11px;">
      <div><strong>${noLabel}</strong></div><div style="font-size:16px;font-weight:800;margin-bottom:8px;">${noValue}</div>
      <div><strong>DATE</strong></div><div style="font-size:14px;font-weight:700;margin-bottom:8px;">${date}</div>
      <div><strong>STATUS</strong></div><div style="font-size:14px;font-weight:700;">${status}</div>
    </div>
    <div style="padding:12px 15px;border-right:1px solid #94a3b8;font-size:11px;">
      <strong>BANK DETAILS:</strong>
      <div style="display:grid;grid-template-columns:90px 1fr;gap:3px 2px;margin-top:6px;">
        <strong>Bank Name :</strong><span>${brand.bankName}</span>
        <strong>Bank Address :</strong><span>${brand.bankAddress}</span>
        <strong>A/C. Number :</strong><span><b>${brand.accountNumber}</b></span>
        <strong>IFSC Code :</strong><span>${brand.ifscCode}</span>
        <strong>Swift Code :</strong><span>${brand.swiftCode}</span>
        <strong>A/C. Holder :</strong><span>${brand.accountHolder}</span>
      </div>
    </div>
    <div style="padding:12px 15px;font-size:11px;display:grid;grid-template-columns:90px 1fr;gap:6px 2px;">
      <strong>GSTIN :</strong><span><b>${brand.gstin}</b></span>
      <strong>PAN No. :</strong><span><b>${brand.pan}</b></span>
      <strong>CIN No. :</strong><span><b>${brand.cin}</b></span>
      <strong>Legal Name :</strong><span>${brand.legalName}</span>
      <strong>IEC Code :</strong><span><b>${brand.iecCode}</b></span>
    </div>
  </div>`;
}

export async function buildProformaPdfAttachment(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({ where: { id: quoteId }, include: { items: true } });
  if (!quote) return null;

  const catalog = await getJournalCatalog();
  const isJournalsPub = quote.items.some((it) => {
    const clean = it.journalName.toLowerCase();
    const match = catalog.find((c) => clean.includes(c.journalName.toLowerCase()) || c.journalName.toLowerCase().includes(clean));
    return !!(match && (match.publisher || "").toLowerCase().replace(/[^a-z0-9]/g, "") === "journalspub");
  });
  const brand = getBrand(isJournalsPub);
  const piNo = formatPiNumber({ id: quote.id, createdAt: quote.createdAt });

  const subtotal = quote.items.reduce((s, i) => s + Number(i.unitPrice || 0), 0);
  const discount = Math.round((subtotal * (quote.couponPercent || 0)) / 100);
  const taxable = subtotal - discount;
  const gst = quote.currency === "INR" ? Math.round(taxable * 0.18) : 0;
  const total = taxable + gst;

  const rows = quote.items
    .map((it, idx) => {
      const unit = Number(it.unitPrice || 0);
      const discountPart = (unit * (quote.couponPercent || 0)) / 100;
      const taxablePart = unit - discountPart;
      const gstPart = quote.currency === "INR" ? taxablePart * 0.18 : 0;
      const netPart = taxablePart + gstPart;
      return `<tr><td style="border-right:1px solid #94a3b8;text-align:center;">${idx + 1}</td><td style="border-right:1px solid #94a3b8;">${it.journalName}</td><td style="border-right:1px solid #94a3b8;text-align:center;">${it.selectedPlan}</td><td style="border-right:1px solid #94a3b8;text-align:right;">${unit.toFixed(2)}</td><td style="border-right:1px solid #94a3b8;text-align:right;">${taxablePart.toFixed(2)}</td><td style="text-align:right;">${netPart.toFixed(2)}</td></tr>`;
    })
    .join("");

  const body = `
    ${headerBlock(brand, "PROFORMA INVOICE")}
    ${metaPanel(brand, "PI NUMBER", piNo, new Date(quote.createdAt).toLocaleDateString("en-IN"), quote.status)}
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #94a3b8;">
      <div style="padding:12px;border-right:1px solid #94a3b8;"><b>BILL TO / DETAILS OF RECEIVER:</b><div>${quote.contactName}</div><div>${quote.organization}</div><div>${quote.address || "N/A"}</div><div>${quote.email}</div></div>
      <div style="padding:12px;"><b>SHIP TO / DELIVERY ADDRESS:</b><div>${quote.sameAsBilling ? quote.contactName : (quote.receiverName || quote.contactName)}</div><div>${quote.sameAsBilling ? (quote.address || "N/A") : (quote.receiverAddress || quote.address || "N/A")}</div><div>${quote.sameAsBilling ? (quote.phone || "N/A") : (quote.receiverPhone || quote.phone || "N/A")}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #94a3b8;" cellpadding="6">
      <thead><tr style="background:#f8fafc;border-bottom:1px solid #94a3b8;"><th style="border-right:1px solid #94a3b8;">Sr.No</th><th style="border-right:1px solid #94a3b8;text-align:left;">Particulars</th><th style="border-right:1px solid #94a3b8;">Plan</th><th style="border-right:1px solid #94a3b8;text-align:right;">Amount</th><th style="border-right:1px solid #94a3b8;text-align:right;">Taxable Value</th><th style="text-align:right;">Net Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:grid;grid-template-columns:1fr 260px;padding:10px 12px;font-size:12px;"><div><b>In Words:</b> Indian Rupees ${Math.round(total).toLocaleString("en-IN")} Only</div><div><div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;"><span>Discount:</span><span>${discount.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;"><span>GST:</span><span>${gst.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;font-weight:800;border-top:1px solid #334155;padding-top:4px;"><span>Total:</span><span>${total.toFixed(2)}</span></div></div></div>
  `;

  return { filename: `proforma-${piNo}.html`, contentType: "text/html", data: Buffer.from(shell(`Proforma ${piNo}`, wrapInvoice(body)), "utf8") };
}

export async function buildOrderPdfAttachment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;

  const catalog = await getJournalCatalog();
  const isJournalsPub = order.items.some((it) => {
    const clean = it.journalName.toLowerCase();
    const match = catalog.find((c) => clean.includes(c.journalName.toLowerCase()) || c.journalName.toLowerCase().includes(clean));
    return !!(match && (match.publisher || "").toLowerCase().replace(/[^a-z0-9]/g, "") === "journalspub");
  });
  const brand = getBrand(isJournalsPub);

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const cgst = Number(order.cgst || 0);
  const sgst = Number(order.sgst || 0);
  const total = Number(order.total || 0);

  const rows = order.items
    .map((it, idx) => {
      const qty = Number(it.qty || 1);
      const amount = Number(it.unitPrice || 0) * qty;
      const itemDiscount = subtotal > 0 ? (amount / subtotal) * discount : 0;
      const taxable = amount - itemDiscount;
      const itemGst = subtotal > 0 ? (amount / subtotal) * (cgst + sgst) : 0;
      const net = taxable + itemGst;
      return `<tr><td style="border-right:1px solid #94a3b8;text-align:center;">${idx + 1}</td><td style="border-right:1px solid #94a3b8;">${it.journalName}</td><td style="border-right:1px solid #94a3b8;text-align:center;">${qty}</td><td style="border-right:1px solid #94a3b8;text-align:right;">${amount.toFixed(2)}</td><td style="border-right:1px solid #94a3b8;text-align:right;">${taxable.toFixed(2)}</td><td style="text-align:right;">${net.toFixed(2)}</td></tr>`;
    })
    .join("");

  const body = `
    ${headerBlock(brand, "TAX INVOICE")}
    ${metaPanel(brand, "INVOICE NUMBER", order.id, new Date(order.createdAt).toLocaleDateString("en-IN"), order.status)}
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #94a3b8;">
      <div style="padding:12px;border-right:1px solid #94a3b8;"><b>BILL TO / DETAILS OF RECEIVER:</b><div>${order.customerName}</div><div>${order.organization || "N/A"}</div><div>${order.address}, ${order.state} - ${order.pincode}</div><div>${order.email}</div></div>
      <div style="padding:12px;"><b>SHIP TO / DELIVERY ADDRESS:</b><div>${order.sameAsBilling ? order.customerName : (order.receiverName || order.customerName)}</div><div>${order.sameAsBilling ? order.address : (order.receiverAddress || order.address)}</div><div>${order.sameAsBilling ? "Same as billing" : (order.receiverPhone || "N/A")}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border-bottom:1px solid #94a3b8;" cellpadding="6">
      <thead><tr style="background:#f8fafc;border-bottom:1px solid #94a3b8;"><th style="border-right:1px solid #94a3b8;">Sr.No</th><th style="border-right:1px solid #94a3b8;text-align:left;">Particulars</th><th style="border-right:1px solid #94a3b8;">Qty</th><th style="border-right:1px solid #94a3b8;text-align:right;">Amount</th><th style="border-right:1px solid #94a3b8;text-align:right;">Taxable Value</th><th style="text-align:right;">Net Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:grid;grid-template-columns:1fr 260px;padding:10px 12px;font-size:12px;"><div><b>In Words:</b> Indian Rupees ${Math.round(total).toLocaleString("en-IN")} Only</div><div><div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;"><span>Discount:</span><span>${discount.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;"><span>CGST:</span><span>${cgst.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;"><span>SGST:</span><span>${sgst.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;font-weight:800;border-top:1px solid #334155;padding-top:4px;"><span>Total:</span><span>${total.toFixed(2)}</span></div></div></div>
  `;

  return { filename: `invoice-${order.id}.html`, contentType: "text/html", data: Buffer.from(shell(`Invoice ${order.id}`, wrapInvoice(body)), "utf8") };
}
