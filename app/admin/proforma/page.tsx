"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { formatPiNumber } from "@/lib/pi-number";

type ProformaItem = { id: string; journalName: string; subject?: string; selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE"; unitPrice: number };
type Proforma = {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  phone?: string;
  country?: string;
  address?: string | null;
  gstNumber?: string | null;
  subscriberCategory?: string | null;
  institutionName?: string | null;
  designation?: string | null;
  couponCode?: string | null;
  couponPercent?: number | null;
  currency?: "INR" | "USD";
  status: "DRAFT" | "SUBMITTED" | "PAID";
  hasVisitedCheckout: boolean;
  adminRemarks: string | null;
  createdAt: string;
  updatedAt?: string;
  items: ProformaItem[];
  createdBy: { id: string; email: string } | null;
};

function proformaPdfFilename(piNumber: string) {
  return `proforma-${piNumber.replace(/[^\w.-]+/g, "_")}.pdf`;
}

function isBookProduct(journalName: string | null | undefined, subject: string | null | undefined): boolean {
  const lowerName = (journalName ?? "").toLowerCase();
  const lowerSubject = (subject ?? "").toLowerCase();
  return (
    lowerSubject.includes("book") ||
    lowerSubject.includes("monograph") ||
    lowerName.includes("book") ||
    lowerName.includes("monograph") ||
    lowerName.includes("handbook") ||
    lowerName.includes("textbook") ||
    lowerName.includes("reference book")
  );
}

function getHsnCode(item: ProformaItem): string {
  if (item.selectedPlan === "ONLINE") return "998431";
  return isBookProduct(item.journalName, item.subject) ? "4901" : "4902";
}

function amountInWords(val: number, currency: "INR" | "USD") {
  const n = Math.floor(val);
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

function getFinancialRows(pi: Proforma) {
  const currency = pi.currency || "INR";
  const couponPct = pi.couponPercent || 0;
  const isGstExemptSubscriber = pi.subscriberCategory === "COLLEGE" || pi.subscriberCategory === "EXISTING_PI";
  let subtotal = 0;
  let discount = 0;
  let gst = 0;

  const items = pi.items.map((it) => {
    const unitPrice = Number(it.unitPrice || 0);
    const itemDiscount = (unitPrice * couponPct) / 100;
    const taxable = unitPrice - itemDiscount;
    const isDigital = it.selectedPlan === "ONLINE" || it.selectedPlan === "PRINT_ONLINE";
    const gstRate = currency === "INR" && isDigital && !isGstExemptSubscriber ? 18 : 0;
    const itemGst = taxable * (gstRate / 100);
    subtotal += unitPrice;
    discount += itemDiscount;
    gst += itemGst;
    return { item: it, unitPrice, itemDiscount, taxable, gstRate, netAmount: taxable + itemGst };
  });

  const total = subtotal - discount + gst;
  return { currency, items, subtotal, discount, cgst: gst / 2, sgst: gst / 2, total };
}

function AdminPiPdfTemplate({ pi }: { pi: Proforma }) {
  const piNumber = formatPiNumber({ id: pi.id, createdAt: pi.createdAt });
  const validDate = new Date(pi.createdAt);
  validDate.setDate(validDate.getDate() + 30);
  const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const financials = getFinancialRows(pi);
  const currency = financials.currency;

  return (
    <article id={`admin-pi-pdf-${pi.id}`} style={{ background: "#ffffff", width: "900px", padding: "30px", fontFamily: "Inter, Arial, sans-serif", color: "#1e293b", fontSize: "12px", lineHeight: "1.5", border: "1px solid #cbd5e1", boxSizing: "border-box" }}>
      <div style={{ border: "1px solid #94a3b8", padding: "1px" }}>
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #94a3b8", padding: "15px 20px" }}>
          <div style={{ width: "15%", display: "flex", justifyContent: "center" }}>
            <img src="/stmlogo.png" alt="STM" style={{ maxHeight: "65px", objectFit: "contain" }} />
          </div>
          <div style={{ width: "85%", textAlign: "center", paddingRight: "10%" }}>
            <h1 style={{ fontSize: "34px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "0.5px" }}>STM Journals</h1>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: 0, color: "#334155" }}>A Division of Consortium e-Learning Network Pvt. Ltd.</p>
            <p style={{ fontSize: "11px", fontWeight: "700", margin: "4px 0 0 0", color: "#1e293b", letterSpacing: "0.04em" }}>PROFORMA INVOICE</p>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>A-118 1st Floor, Sector 63, Noida, Uttar Pradesh, India - 201301</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #94a3b8" }}>
          <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#475569" }}>PROFORMA INVOICE NUMBER :</span>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>{piNumber}</div>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#475569" }}>PROFORMA INVOICE DATE :</span>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>{formatDate(new Date(pi.createdAt))}</div>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#475569" }}>VALID UNTIL :</span>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb", margin: "4px 0 0 0" }}>{formatDate(validDate)}</div>
          </div>
          <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8", fontSize: "11px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#475569", display: "block", marginBottom: "6px" }}>BANK DETAILS:</span>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "4px 2px" }}>
              <strong style={{ color: "#475569" }}>Bank Name :</strong> <span>HDFC Bank</span>
              <strong style={{ color: "#475569" }}>Bank Address :</strong> <span>Sector-62, Noida, U.P., India</span>
              <strong style={{ color: "#475569" }}>A/C. Number :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>03942000001153</span>
              <strong style={{ color: "#475569" }}>IFSC Code :</strong> <span>HDFC0002649</span>
              <strong style={{ color: "#475569" }}>Swift Code :</strong> <span>HDFCINBBXXX</span>
              <strong style={{ color: "#475569" }}>A/C. Holder :</strong> <span style={{ fontWeight: "600" }}>Consortium eLearning Network Pvt. Ltd.</span>
            </div>
          </div>
          <div style={{ padding: "12px 15px", fontSize: "11px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "8px 2px" }}>
              <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>GSTIN :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>09AACCC6494M1Z1</span>
              <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>PAN No. :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>AACCC6494M</span>
              <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>CIN No. :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>U80302DL2005PTC138759</span>
              <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>Legal Name :</strong> <span>Consortium e-Learning Network Pvt. Ltd.</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #94a3b8", minHeight: "120px" }}>
          <div style={{ padding: "15px", borderRight: "1px solid #94a3b8" }}>
            <h4 style={{ fontSize: "10px", fontWeight: "750", textTransform: "uppercase", borderBottom: "1.5px solid #334155", paddingBottom: "4px", margin: "0 0 12px 0", display: "inline-block", color: "#1e293b" }}>BILL TO / DETAILS OF RECEIVER:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", gap: "6px 4px", fontSize: "11.5px" }}>
              <strong style={{ color: "#64748b" }}>Name :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{pi.contactName}</span>
              <strong style={{ color: "#64748b" }}>Institution :</strong> <span style={{ fontWeight: "600" }}>{pi.institutionName || pi.organization || "N/A"}</span>
              <strong style={{ color: "#64748b" }}>Address :</strong> <span>{pi.address || "N/A"}<br />Phone:- {pi.phone || "N/A"} Email:- {pi.email}</span>
              <strong style={{ color: "#64748b" }}>GSTIN :</strong> <span style={{ fontWeight: "700" }}>{pi.gstNumber || "N/A"}</span>
            </div>
          </div>
          <div style={{ padding: "15px" }}>
            <h4 style={{ fontSize: "10px", fontWeight: "750", textTransform: "uppercase", borderBottom: "1.5px solid #334155", paddingBottom: "4px", margin: "0 0 12px 0", display: "inline-block", color: "#1e293b" }}>SHIP TO / DELIVERY ADDRESS:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", gap: "6px 4px", fontSize: "11.5px" }}>
              <strong style={{ color: "#64748b" }}>Recipient :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{pi.contactName}</span>
              <strong style={{ color: "#64748b" }}>Address :</strong> <span>{pi.address || "N/A"}</span>
              <strong style={{ color: "#64748b" }}>Contact :</strong> <span>{pi.phone || "N/A"}</span>
              <strong style={{ color: "#64748b" }}>Category :</strong> <span>{pi.subscriberCategory || "N/A"}</span>
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #94a3b8" }} cellPadding="6">
          <thead>
            <tr style={{ borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontSize: "10.5px", fontWeight: "800" }}>
              <th style={{ width: "5%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>Sr.No</th>
              <th style={{ width: "35%", borderRight: "1px solid #94a3b8", textAlign: "left" }}>Particulars</th>
              <th style={{ width: "10%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>HSN/SAC</th>
              <th style={{ width: "6%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>Qty</th>
              <th style={{ width: "11%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Unit Price</th>
              <th style={{ width: "10%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Discount</th>
              <th style={{ width: "12%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Taxable Value</th>
              <th style={{ width: "10%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>GST Rate (%)</th>
              <th style={{ width: "12%", textAlign: "right" }}>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {financials.items.map((it, idx) => (
              <tr key={it.item.id} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "11.5px" }}>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center", color: "#475569" }}>{idx + 1}</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "left", fontWeight: "600", color: "#1e293b", lineHeight: "1.3", padding: "8px 6px" }}>{it.item.journalName}</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center" }}>{getHsnCode(it.item)}</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center" }}>1</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{it.unitPrice.toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{it.itemDiscount.toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right", fontWeight: "600" }}>{it.taxable.toFixed(2)}</td>
                <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{it.gstRate.toFixed(2)}</td>
                <td style={{ textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{it.netAmount.toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} style={{ borderRight: "1px solid #94a3b8", borderTop: "1px solid #94a3b8", verticalAlign: "top", padding: "12px" }}>
                <strong style={{ color: "#0f172a" }}>In Words:</strong> {amountInWords(financials.total, currency)}
              </td>
              <td colSpan={4} style={{ borderTop: "1px solid #94a3b8", padding: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "4px", padding: "10px", fontSize: "11.5px" }}>
                  <span style={{ textAlign: "right", color: "#64748b" }}>Subtotal:</span><span style={{ textAlign: "right", fontWeight: "600" }}>{financials.subtotal.toFixed(2)}</span>
                  {financials.discount > 0 ? <><span style={{ textAlign: "right", color: "#64748b" }}>Discount:</span><span style={{ textAlign: "right", color: "#ef4444" }}>-{financials.discount.toFixed(2)}</span></> : null}
                  {currency === "INR" ? <><span style={{ textAlign: "right", color: "#64748b" }}>CGST (9%):</span><span style={{ textAlign: "right" }}>{financials.cgst.toFixed(2)}</span><span style={{ textAlign: "right", color: "#64748b" }}>SGST (9%):</span><span style={{ textAlign: "right" }}>{financials.sgst.toFixed(2)}</span></> : null}
                  <span style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px", fontSize: "13px" }}>Total ({currency}):</span>
                  <span style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px", fontSize: "13px" }}>{financials.total.toFixed(2)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ padding: "12px 15px", borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontStyle: "italic", color: "#334155", fontSize: "11px" }}>
          The sum of {currency} {Math.round(financials.total)}/- is a payment on account of subscription by NEFT/RTGS.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", padding: "15px" }}>
          <div>
            <strong style={{ fontSize: "10px", textDecoration: "underline", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "#1e293b" }}>TERMS & CONDITIONS:</strong>
            <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "10.5px", color: "#475569", lineHeight: "1.6" }}>
              <li>All subscription amount mentioned is as per year fee.</li>
              <li>Missing numbers will not be supplied if claims are received more than six months.</li>
              <li>Invoice subject to realization of demand draft/cheque.</li>
            </ol>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", textAlign: "center" }}>
            <strong style={{ color: "#0f172a", fontSize: "11px", marginBottom: "8px" }}>For, STM JOURNALS</strong>
            <img src="/authorized-signature.png" alt="Authorised Signature" style={{ width: "130px", height: "auto", objectFit: "contain", marginBottom: "6px" }} />
            <div style={{ width: "180px", borderBottom: "1px solid #64748b" }} />
            <span style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", marginTop: "5px", letterSpacing: "0.05em", color: "#334155" }}>AUTHORISED SIGNATORY</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", borderTop: "1px dashed #cbd5e1", marginTop: "12px", paddingTop: "8px", fontSize: "10px", color: "#64748b" }}>
        Tel: 01120 - 4781206 | Mob: +91-9810078958 | E-mail: subscriptions@stmjournals.com | Website: shop.stmjournals.com
      </div>
    </article>
  );
}

export default function AdminProformaPage() {
  const [rows, setRows] = useState<Proforma[]>([]);
  const [error, setError] = useState("");
  const [editingRemarks, setEditingRemarks] = useState<Record<string, string>>({});
  const [activePi, setActivePi] = useState<Proforma | null>(null);
  const [downloadingId, setDownloadingId] = useState("");
  const [downloadPi, setDownloadPi] = useState<Proforma | null>(null);

  async function load() {
    const res = await fetch("/api/admin/proforma", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; proformas?: Proforma[]; error?: string; warning?: string };
    if (!json.ok) return setError(json.error || "Failed to load quotes");
    setError(json.warning || "");
    setRows(json.proformas || []);
  }

  useEffect(() => { void load(); }, []);

  async function updateStatus(id: string, status: Proforma["status"]) {
    await fetch(`/api/admin/proforma/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  async function updateRemark(id: string) {
    const remark = editingRemarks[id];
    await fetch(`/api/admin/proforma/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ adminRemarks: remark }) });
    await load();
  }

  async function downloadGeneratedPiPdf(pi: Proforma) {
    setDownloadPi(pi);
    setDownloadingId(pi.id);

    window.setTimeout(async () => {
      try {
        const input = document.getElementById(`admin-pi-pdf-${pi.id}`);
        if (!input) return;
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(input, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff"
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.82);
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const scale = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height) * 0.95;
        const finalWidth = canvas.width * scale;
        const finalHeight = canvas.height * scale;
        const marginX = (pdfWidth - finalWidth) / 2;
        const marginY = (pdfHeight - finalHeight) / 2;
        pdf.addImage(imgData, "JPEG", marginX, marginY, finalWidth, finalHeight);
        const piNumber = formatPiNumber({ id: pi.id, createdAt: pi.createdAt });
        pdf.save(proformaPdfFilename(piNumber));
      } catch (err) {
        console.error("Failed to generate admin proforma PDF", err);
        setError("Failed to generate proforma PDF.");
      } finally {
        setDownloadingId("");
        setDownloadPi(null);
      }
    }, 100);
  }

  return (
    <section className="admin-page" style={{maxWidth: "1300px", margin: "0 auto", padding: "20px"}}>
      <h1 style={{marginBottom:"20px", borderBottom:"2px solid #f1f5f9", paddingBottom:"10px"}}>📄 Proforma Master Dashboard</h1>
      {error ? <p className="auth-error" style={{color:"red"}}>{error}</p> : null}
      <div className="admin-table-wrap" style={{overflowX:"auto"}}>
        <table className="admin-table" style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc", textAlign:"left", fontSize:"13px"}}>
              <th style={{padding:"12px"}}>Organization / Contact</th>
              <th style={{padding:"12px"}}>PI Details</th>
              <th style={{padding:"12px"}}>Actions</th>
              <th style={{padding:"12px"}}>Engagement Status</th>
              <th style={{padding:"12px"}}>Payment Level</th>
              <th style={{padding:"12px"}}>Admin Confirmation</th>
              <th style={{padding:"12px"}}>Remarks</th>
              <th style={{padding:"12px"}}>Date Generated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{borderBottom:"1px solid #e2e8f0", fontSize:"13px"}}>
                <td style={{padding:"12px"}}>
                  <strong>{r.organization}</strong><br />
                  <span style={{fontSize:"12px", color:"#64748b"}}>{r.contactName} ({r.email})</span>
                </td>
                <td style={{padding:"12px", fontSize:"12px", color:"#475569"}}>
                  <div>{r.institutionName || "-"}</div>
                  <div>{r.designation || "-"}</div>
                  <div style={{fontWeight:"600"}}>{r.subscriberCategory || "-"}</div>
                </td>
                <td style={{padding:"12px"}}>
                  <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    title="View PI details"
                    onClick={() => setActivePi(r)}
                    style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}
                  >
                    👁
                  </button>
                  <button
                    type="button"
                    title="Download generated PI PDF"
                    onClick={() => void downloadGeneratedPiPdf(r)}
                    disabled={downloadingId === r.id}
                    style={{ border: "1px solid #cbd5e1", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", padding: "4px 8px", cursor: downloadingId === r.id ? "wait" : "pointer", fontSize: "12px", fontWeight: 700 }}
                  >
                    {downloadingId === r.id ? "..." : "PDF"}
                  </button>
                  </div>
                </td>
                <td style={{padding:"12px"}}>
                  {r.hasVisitedCheckout ? (
                    <span style={{background:"#dbeafe", color:"#1e40af", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>🔗 VISITED CHECKOUT ✅</span>
                  ) : (
                    <span style={{background:"#f1f5f9", color:"#64748b", padding:"4px 8px", borderRadius:"4px", fontSize:"11px"}}>UNOPENED</span>
                  )}
                </td>
                <td style={{padding:"12px"}}>
                  {r.status === "PAID" ? (
                    <span style={{background:"#dcfce7", color:"#166534", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>PAID</span>
                  ) : r.status === "SUBMITTED" ? (
                    <span style={{background:"#fff7ed", color:"#9a3412", padding:"4px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>ISSUED / PENDING</span>
                  ) : (
                    <span style={{background:"#f1f5f9", color:"#475569", padding:"4px 8px", borderRadius:"4px", fontSize:"11px"}}>DRAFT</span>
                  )}
                </td>
                <td style={{padding:"12px"}}>
                  <select 
                    value={r.status} 
                    onChange={(e) => void updateStatus(r.id, e.target.value as Proforma["status"])}
                    style={{padding:"4px", fontSize:"12px"}}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="PAID">PAID (Admin Force)</option>
                  </select>
                </td>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex", gap:"5px"}}>
                    <input 
                      type="text" 
                      placeholder="Admin note..." 
                      defaultValue={r.adminRemarks || ""}
                      onChange={(e) => setEditingRemarks(prev => ({ ...prev, [r.id]: e.target.value }))}
                      style={{fontSize:"12px", padding:"4px", width:"140px"}}
                    />
                    <button 
                      onClick={() => updateRemark(r.id)}
                      style={{fontSize:"10px", background:"#0f2a57", color:"white", border:"none", padding:"4px 8px", borderRadius:"3px", cursor:"pointer"}}
                    >
                      Save
                    </button>
                  </div>
                </td>
                <td style={{padding:"12px", color:"#64748b"}}>{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activePi ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "min(980px, 95vw)", maxHeight: "90vh", overflow: "auto", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0 }}>PI User Details</h3>
              <button type="button" onClick={() => setActivePi(null)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "8px", fontSize: "13px" }}>
              <strong>Name:</strong><span>{activePi.contactName || "-"}</span>
              <strong>Email:</strong><span>{activePi.email || "-"}</span>
              <strong>Phone:</strong><span>{activePi.phone || "-"}</span>
              <strong>Institution:</strong><span>{activePi.institutionName || activePi.organization || "-"}</span>
              <strong>Designation:</strong><span>{activePi.designation || "-"}</span>
              <strong>Category:</strong><span>{activePi.subscriberCategory || "-"}</span>
              <strong>Address:</strong><span>{activePi.address || "-"}</span>
              <strong>Country:</strong><span>{activePi.country || "-"}</span>
              <strong>GSTIN:</strong><span>{activePi.gstNumber || "-"}</span>
              <strong>Coupon:</strong><span>{activePi.couponCode ? `${activePi.couponCode} (${activePi.couponPercent || 0}%)` : "Not Used"}</span>
              <strong>PI Created:</strong><span>{new Date(activePi.createdAt).toLocaleString()}</span>
              <strong>Last Updated:</strong><span>{activePi.updatedAt ? new Date(activePi.updatedAt).toLocaleString() : "-"}</span>
              <strong>PI Number:</strong><span>{formatPiNumber({ id: activePi.id, createdAt: activePi.createdAt })}</span>
            </div>

            <div style={{ marginTop: "16px" }}>
              <h4 style={{ margin: "0 0 8px 0" }}>Selected Journals, Variants & Price Breakdown</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #e2e8f0" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>#</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Journal</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Variant</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {activePi.items.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "10px", textAlign: "center", color: "#64748b" }}>No journals added yet.</td></tr>
                  ) : (
                    activePi.items.map((it, idx) => (
                      <tr key={it.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px" }}>{idx + 1}</td>
                        <td style={{ padding: "8px" }}>{it.journalName}</td>
                        <td style={{ padding: "8px" }}>{it.selectedPlan === "PRINT_ONLINE" ? "PRINT + DIGITAL" : it.selectedPlan}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>₹{it.unitPrice.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  {(() => {
                    const subtotal = activePi.items.reduce((sum, it) => sum + (it.unitPrice || 0), 0);
                    const couponPct = activePi.couponPercent || 0;
                    const discountAmt = Math.round((subtotal * couponPct) / 100);
                    const totalAfterDiscount = subtotal - discountAmt;
                    return (
                      <>
                        <tr style={{ borderTop: "1px solid #cbd5e1", background: "#fcfdff" }}>
                          <td colSpan={3} style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>Subtotal</td>
                          <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>₹{subtotal.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} style={{ padding: "8px", textAlign: "right", color: "#16a34a" }}>
                            Coupon Discount {activePi.couponCode ? `(${activePi.couponCode} - ${couponPct}%)` : ""}
                          </td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#16a34a" }}>-₹{discountAmt.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr style={{ borderTop: "1px solid #cbd5e1", background: "#f8fafc" }}>
                          <td colSpan={3} style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>Net Amount</td>
                          <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>₹{totalAfterDiscount.toLocaleString("en-IN")}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : null}
      {downloadPi ? (
        <div style={{ position: "fixed", left: "-10000px", top: 0, width: "900px", pointerEvents: "none" }}>
          <AdminPiPdfTemplate pi={downloadPi} />
        </div>
      ) : null}
    </section>
  );
}
