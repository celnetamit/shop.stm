import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPiNumber } from "@/lib/pi-number";
import { getJournalCatalog } from "@/lib/journal-catalog";

const invoiceStampData = readFileSync(join(process.cwd(), "public", "invoice-stamp.png")).toString("base64");
const signatureData = readFileSync(join(process.cwd(), "public", "authorized-signature.png")).toString("base64");

function drawFrame(pdf: jsPDF, pageWidth: number, pageHeight: number, frameMargin: number) {
  pdf.setDrawColor(148, 163, 184);
  pdf.setLineWidth(0.35);
  pdf.rect(frameMargin, frameMargin, pageWidth - frameMargin * 2, pageHeight - frameMargin * 2);
}

function drawSignatureFooter(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  startY: number,
  brandTitle: string,
  terms: string[],
  signatureLabel = "AUTHORISED SIGNATORY"
) {
  const frameMargin = 10;
  const footerHeight = 50;
  const minimumBottomGap = 18;
  let footerTop = startY;

  if (pageHeight - footerTop < footerHeight + minimumBottomGap) {
    pdf.addPage();
    pageWidth = pdf.internal.pageSize.getWidth();
    pageHeight = pdf.internal.pageSize.getHeight();
    drawFrame(pdf, pageWidth, pageHeight, frameMargin);
    footerTop = 20;
  }

  pdf.setDrawColor(226, 232, 240);
  pdf.line(14, footerTop - 4, pageWidth - 14, footerTop - 4);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text("TERMS & CONDITIONS:", 14, footerTop);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.8);
  pdf.setTextColor(71, 85, 105);
  let currentY = footerTop + 5;
  for (const [index, term] of terms.entries()) {
    const lines = pdf.splitTextToSize(`${index + 1}. ${term}`, Math.max(70, pageWidth * 0.5));
    pdf.text(lines, 14, currentY);
    currentY += lines.length * 4 + 1.5;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`For, ${brandTitle.toUpperCase()}`, pageWidth - 14, footerTop, { align: "right" });
  pdf.addImage(`data:image/png;base64,${invoiceStampData}`, "PNG", pageWidth - 76, footerTop + 3, 28, 28);
  pdf.addImage(`data:image/png;base64,${signatureData}`, "PNG", pageWidth - 74, footerTop + 19, 42, 16);
  pdf.setDrawColor(100, 116, 139);
  pdf.line(pageWidth - 71, footerTop + 37, pageWidth - 24, footerTop + 37);
  pdf.setFontSize(8.5);
  pdf.text(signatureLabel, pageWidth - 14, footerTop + 43, { align: "right" });
}

function isBookProduct(journalName: string, subject: string): boolean {
  const lowerName = journalName.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  return lowerSubject.includes("book") || lowerSubject.includes("monograph") || lowerName.includes("book") || lowerName.includes("monograph");
}

function getHsnCode(journalName: string, subject: string, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE"): string {
  if (plan === "ONLINE") return "998431";
  return isBookProduct(journalName, subject) ? "4901" : "4902";
}

function amountInWords(value: number, currency: "INR" | "USD") {
  const n = Math.floor(value);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`);
  const threeDigits = (x: number) => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    return h ? `${ones[h]} Hundred${r ? ` ${twoDigits(r)}` : ""}` : twoDigits(r);
  };
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts = [
    crore ? `${twoDigits(crore)} Crore` : "",
    lakh ? `${twoDigits(lakh)} Lakh` : "",
    thousand ? `${twoDigits(thousand)} Thousand` : "",
    rest ? threeDigits(rest) : ""
  ].filter(Boolean);
  return `${currency === "USD" ? "US Dollars" : "Indian Rupees"} ${parts.length ? parts.join(" ") : "Zero"} Only`;
}

export async function buildProformaPdfAttachment(quoteId: string) {
  const quote = await prisma.proformaQuote.findUnique({
    where: { id: quoteId },
    include: { items: true, createdBy: true }
  });
  if (!quote) return null;

  const piNo = formatPiNumber({ id: quote.id, createdAt: quote.createdAt });
  const subtotal = quote.items.reduce((s, i) => s + Number(i.unitPrice || 0), 0);
  const discountPct = quote.couponPercent || 0;
  const discount = Math.round((subtotal * discountPct) / 100);
  const taxable = subtotal - discount;

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

  const hasDigital = quote.items.some((it) => it.selectedPlan === "ONLINE" || it.selectedPlan === "PRINT_ONLINE");
  const gst = quote.currency === "INR" && hasDigital && !isGstExempt ? Math.round(taxable * 0.18) : 0;
  const total = taxable + gst;

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const frameMargin = 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(`PROFORMA INVOICE - ${piNo}`, 14, 16);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Date: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}`, 14, 23);
  pdf.text(`Status: ${quote.status}`, 14, 28);
  pdf.text(`Customer: ${quote.contactName}`, 14, 33);
  pdf.text(`Institution: ${quote.organization || "N/A"}`, 14, 38);
  pdf.text(`Email: ${quote.email}`, 14, 43);
  pdf.text(`Address: ${quote.address || "N/A"}`, 14, 48);
  pdf.text(
    `Receiver: ${quote.sameAsBilling ? quote.contactName : (quote.receiverName || quote.contactName)}`,
    14,
    53
  );
  pdf.text(
    `Receiver Address: ${quote.sameAsBilling ? (quote.address || "N/A") : (quote.receiverAddress || quote.address || "N/A")}`,
    14,
    58
  );

  autoTable(pdf, {
    startY: 66,
    head: [["#", "Journal Name", "Plan", "HSN", "Unit Price"]],
    body: quote.items.map((it, idx) => {
      const isBook = isBookProduct(it.journalName, it.subject);
      const hsn = it.selectedPlan === "ONLINE" ? "998431" : isBook ? "4901" : "4902";
      return [
        String(idx + 1),
        it.journalName,
        it.selectedPlan,
        hsn,
        `${quote.currency} ${Number(it.unitPrice || 0).toFixed(2)}`
      ];
    }),
    styles: { fontSize: 8.5, cellPadding: 2, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [15, 42, 87], textColor: [255, 255, 255] },
    rowPageBreak: "avoid",
    pageBreak: "auto",
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 90 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 30, halign: "right" }
    },
    margin: { top: 18, left: 14, right: 14, bottom: 24 },
    didDrawPage: () => {
      drawFrame(pdf, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), frameMargin);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Proforma ${piNo}`, pageWidth - 14, 10, { align: "right" });
    }
  });

  const finalY = (pdf as any).lastAutoTable?.finalY || 74;
  const summaryBlockHeight = gst > 0 ? 28 : 23;
  const summaryFooterHeight = 10;
  const reservedBottom = 24;
  const availableSpace = pageHeight - reservedBottom - finalY;
  let summaryY = finalY + 10;
  if (availableSpace < summaryBlockHeight + summaryFooterHeight) {
    pdf.addPage();
    drawFrame(pdf, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), frameMargin);
    summaryY = 20;
  }

  pdf.setDrawColor(226, 232, 240);
  pdf.line(14, summaryY - 4, pageWidth - 14, summaryY - 4);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.text(`Subtotal: ${quote.currency} ${subtotal.toFixed(2)}`, 14, summaryY);
  pdf.text(`Discount: ${quote.currency} ${discount.toFixed(2)}`, 14, summaryY + 5);
  if (gst > 0) {
    pdf.text(`GST: ${quote.currency} ${gst.toFixed(2)}`, 14, summaryY + 10);
  }
  pdf.setFontSize(12);
  pdf.text(`Total: ${quote.currency} ${total.toFixed(2)}`, 14, summaryY + (gst > 0 ? 17 : 12));

  drawSignatureFooter(
    pdf,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight(),
    summaryY + (gst > 0 ? 24 : 19),
    "STM JOURNALS",
    [
      "All subscription amount mentioned is as per year fee (Between January and December).",
      "Missing numbers will not be supplied if claims are received more than six months.",
      "Invoice subject to realization of demand draft/cheque."
    ]
  );

  return {
    filename: `proforma-${piNo}.pdf`,
    contentType: "application/pdf",
    data: Buffer.from(pdf.output("arraybuffer"))
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

  const catalog = await getJournalCatalog();
  const isJournalsPub = order.items.some((item) => {
    const cleanItemName = item.journalName.toLowerCase();
    const match = catalog.find((cat) => cleanItemName.includes(cat.journalName.toLowerCase()) || cat.journalName.toLowerCase().includes(cleanItemName));
    return !!(match && match.publisher && match.publisher.toLowerCase().replace(/[^a-z0-9]/g, "") === "journalspub");
  });
  const brandTitle = isJournalsPub ? "JOURNALS PUB" : "STM JOURNALS";
  const brandSubtitle = isJournalsPub
    ? "A Division of Dhruv Infosystems Private Limited"
    : "A Division of Consortium e-Learning Network Pvt. Ltd.";

  const pdf = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const frameMargin = 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(`TAX INVOICE - ${order.id}`, 14, 16);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 14, 22);
  pdf.text(`Status: ${order.status}`, 14, 27);
  pdf.text(`Customer: ${order.customerName}`, 14, 32);
  pdf.text(`Institution: ${order.organization || "N/A"}`, 14, 37);
  pdf.text(`Email: ${order.email}`, 14, 42);
  pdf.text(`Company: ${brandTitle} | ${brandSubtitle}`, 14, 47);
  pdf.text(`Address: ${order.address}, ${order.state} - ${order.pincode}`, 14, 52);
  pdf.text(
    `Receiver: ${order.sameAsBilling ? order.customerName : (order.receiverName || order.customerName)}`,
    14,
    57
  );
  pdf.text(
    `Receiver Address: ${order.sameAsBilling ? order.address : (order.receiverAddress || order.address)}`,
    14,
    62
  );

  autoTable(pdf, {
    startY: 70,
    head: [["#", "Journal Name", "Plan", "HSN", "Qty", "Unit Price", "Amount", "Discount", "Taxable", "GST %", "Net"]],
    body: order.items.map((it, idx) => {
      const qty = Number(it.qty || 1);
      const amount = Number(it.unitPrice || 0) * qty;
      const itemDiscount = subtotal > 0 ? (amount / subtotal) * discount : 0;
      const taxable = amount - itemDiscount;
      const itemGst = subtotal > 0 ? (amount / subtotal) * (cgst + sgst) : 0;
      const net = taxable + itemGst;
      const gstRate = taxable > 0 ? (itemGst / taxable) * 100 : 0;
      return [
        String(idx + 1),
        it.journalName,
        it.selectedPlan,
        getHsnCode(it.journalName, it.subject || "", it.selectedPlan),
        String(qty),
        `${order.currency} ${Number(it.unitPrice || 0).toFixed(2)}`,
        `${order.currency} ${amount.toFixed(2)}`,
        `${order.currency} ${itemDiscount.toFixed(2)}`,
        `${order.currency} ${taxable.toFixed(2)}`,
        gstRate.toFixed(2),
        `${order.currency} ${net.toFixed(2)}`
      ];
    }),
    styles: { fontSize: 7.8, cellPadding: 1.8, overflow: "linebreak", valign: "middle" },
    headStyles: { fillColor: [15, 42, 87], textColor: [255, 255, 255] },
    rowPageBreak: "avoid",
    pageBreak: "auto",
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 72 },
      2: { cellWidth: 20 },
      3: { cellWidth: 18 },
      4: { cellWidth: 10 },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
      8: { cellWidth: 20, halign: "right" },
      9: { cellWidth: 12, halign: "right" },
      10: { cellWidth: 20, halign: "right" }
    },
    margin: { top: 18, left: 14, right: 14, bottom: 24 },
    didDrawPage: () => {
      drawFrame(pdf, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), frameMargin);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Invoice ${order.id}`, pageWidth - 14, 10, { align: "right" });
    }
  });

  const finalY = (pdf as any).lastAutoTable?.finalY || 74;
  const summaryHeight = 18 + (cgst > 0 || sgst > 0 ? 5 : 0);
  let summaryY = finalY + 8;
  if (pageHeight - summaryY < summaryHeight + 60) {
    pdf.addPage();
    drawFrame(pdf, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), frameMargin);
    summaryY = 20;
  }

  pdf.setDrawColor(226, 232, 240);
  pdf.line(14, summaryY - 4, pageWidth - 14, summaryY - 4);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`In Words: ${amountInWords(total, order.currency)}`, 14, summaryY);
  pdf.setFontSize(10.5);
  const totalsLabelX = pageWidth - 70;
  const totalsValueX = pageWidth - 14;
  const totalsStartY = summaryY;
  pdf.setTextColor(71, 85, 105);
  pdf.text("Subtotal:", totalsLabelX, totalsStartY, { align: "right" });
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${order.currency} ${subtotal.toFixed(2)}`, totalsValueX, totalsStartY, { align: "right" });
  pdf.setTextColor(71, 85, 105);
  pdf.text("Discount:", totalsLabelX, totalsStartY + 5, { align: "right" });
  pdf.setTextColor(239, 68, 68);
  pdf.text(`${order.currency} ${discount.toFixed(2)}`, totalsValueX, totalsStartY + 5, { align: "right" });
  if (cgst > 0 || sgst > 0) {
    pdf.setTextColor(71, 85, 105);
    pdf.text("CGST (9%):", totalsLabelX, totalsStartY + 10, { align: "right" });
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${order.currency} ${cgst.toFixed(2)}`, totalsValueX, totalsStartY + 10, { align: "right" });
    pdf.setTextColor(71, 85, 105);
    pdf.text("SGST (9%):", totalsLabelX, totalsStartY + 15, { align: "right" });
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${order.currency} ${sgst.toFixed(2)}`, totalsValueX, totalsStartY + 15, { align: "right" });
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Total (${order.currency}):`, totalsLabelX, totalsStartY + 22, { align: "right" });
    pdf.text(`${order.currency} ${total.toFixed(2)}`, totalsValueX, totalsStartY + 22, { align: "right" });
  } else {
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Total (${order.currency}):`, totalsLabelX, totalsStartY + 12, { align: "right" });
    pdf.text(`${order.currency} ${total.toFixed(2)}`, totalsValueX, totalsStartY + 12, { align: "right" });
  }

  drawSignatureFooter(
    pdf,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight(),
    summaryY + (cgst > 0 || sgst > 0 ? 32 : 24),
    brandTitle,
    [
      "All subscription amount mentioned is as per yearly fee.",
      "Missing numbers will not be supplied if claims are received after six months.",
      "Invoice subject to realization of demand draft/cheque."
    ]
  );

  return {
    filename: `invoice-${order.id}.pdf`,
    contentType: "application/pdf",
    data: Buffer.from(pdf.output("arraybuffer"))
  };
}
