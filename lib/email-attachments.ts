import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPiNumber } from "@/lib/pi-number";

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
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setDrawColor(148, 163, 184);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Proforma ${piNo}`, pageWidth - 14, 10, { align: "right" });
    }
  });

  const finalY = (pdf as any).lastAutoTable?.finalY || 74;
  let summaryY = finalY + 10;
  if (summaryY > 250) {
    pdf.addPage();
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
  if (cgst > 0 || sgst > 0) {
    lines.push(`CGST: ${order.currency} ${cgst.toFixed(2)}`);
    lines.push(`SGST: ${order.currency} ${sgst.toFixed(2)}`);
  }
  lines.push(`Total: ${order.currency} ${total.toFixed(2)}`);

  return {
    filename: `invoice-${order.id}.pdf`,
    contentType: "application/pdf",
    data: createSimplePdf(`INVOICE ${order.id}`, lines)
  };
}
