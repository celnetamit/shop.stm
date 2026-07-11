"use client";

import { useEffect, useState } from "react";
import { formatPiNumber } from "@/lib/pi-number";
import SignatureBlock from "@/app/components/invoice/signature-block";

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
  createdBy: { id: string; email: string; role: string } | null;
};

export default function AdminProformaPage() {
  const [rows, setRows] = useState<Proforma[]>([]);
  const [error, setError] = useState("");
  const [editingRemarks, setEditingRemarks] = useState<Record<string, string>>({});
  const [activePi, setActivePi] = useState<Proforma | null>(null);
  const [downloadingId, setDownloadingId] = useState("");
  const [printTargetId, setPrintTargetId] = useState("");

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

  function schedulePrintPi(pi: Proforma) {
    setActivePi(pi);
    setPrintTargetId(pi.id);
  }

  async function downloadGeneratedPiPdf(pi: Proforma) {
    setDownloadingId(pi.id);
    try {
      schedulePrintPi(pi);
    } catch (err) {
      console.error("Failed to generate admin proforma PDF", err);
      setError("Failed to generate proforma PDF.");
    } finally {
      setDownloadingId("");
    }
  }

  useEffect(() => {
    if (!printTargetId || !activePi || activePi.id !== printTargetId) return;

    const timer = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.focus();
          window.print();
        });
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [activePi, printTargetId]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintTargetId("");
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const printablePi = activePi;
  const printableSubtotal = printablePi ? printablePi.items.reduce((sum, it) => sum + (it.unitPrice || 0), 0) : 0;
  const printableCouponPct = printablePi?.couponPercent || 0;
  const printableDiscount = printablePi ? Math.round((printableSubtotal * printableCouponPct) / 100) : 0;
  const printableTaxable = printableSubtotal - printableDiscount;
  const printableCurrency = printablePi?.currency || "INR";
  const printableIsDigital = Boolean(printablePi?.items.some((item) => item.selectedPlan === "ONLINE" || item.selectedPlan === "PRINT_ONLINE"));
  const printableGstRate = printablePi && printablePi.currency === "INR" && printableIsDigital ? 18 : 0;
  const printableGst = Math.round((printableTaxable * printableGstRate) / 100);
  const printableTotal = printableTaxable + printableGst;
  const printablePiNumber = printablePi ? formatPiNumber({ id: printablePi.id, createdAt: printablePi.createdAt }) : "";
  const printableIsJournalsPub = Boolean(
    printablePi &&
      (printablePi.organization.toLowerCase().includes("journalspub") ||
        printablePi.email.toLowerCase().includes("journalspub") ||
        printablePi.items.some((item) => item.journalName.toLowerCase().includes("journalspub")))
  );
  const printableCompanyName = printableIsJournalsPub ? "Journals Pub" : "STM Journals";
  const printableCompanyLines = printableIsJournalsPub
    ? ["A Division of Dhruv Infosystems Private Limited", "A-118, 2nd Floor, A-Block, Sector-63, Noida - 201301", "Info@journalspub.com"]
    : ["A Division of Consortium e-Learning Network Pvt. Ltd.", "A-118, 1st Floor, A-Block, Sector-63, Noida - 201301", "info@stmjournals.in"];

  return (
    <section className="admin-page admin-page-shell" style={{maxWidth: "1300px", margin: "0 auto", padding: "20px"}}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: auto;
          margin: 12mm 10mm 16mm 10mm;
        }

        @media print {
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0 !important;
          }

          .admin-page-shell {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .admin-page-shell > :not(.admin-proforma-print) {
            display: none !important;
          }

          .admin-proforma-print {
            display: block !important;
          }

          .admin-proforma-print .proforma-invoice table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .admin-proforma-print .proforma-invoice thead {
            display: table-header-group !important;
          }

          .admin-proforma-print .proforma-invoice tbody {
            display: table-row-group !important;
          }

          .admin-proforma-print .proforma-invoice tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      ` }} />
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
                    title="Print / Save as PDF"
                    onClick={() => void downloadGeneratedPiPdf(r)}
                    disabled={downloadingId === r.id}
                    style={{ border: "1px solid #cbd5e1", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", padding: "4px 8px", cursor: downloadingId === r.id ? "wait" : "pointer", fontSize: "12px", fontWeight: 700 }}
                  >
                    {downloadingId === r.id ? "..." : "Print"}
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

      {printablePi ? (
        <div className="admin-proforma-print" style={{ display: "none" }}>
          <article className="proforma-invoice" style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "900px",
            padding: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            color: "#1e293b",
            fontSize: "12px",
            lineHeight: "1.5",
            border: "1px solid #cbd5e1",
            position: "relative",
            boxSizing: "border-box"
          }}>
            <div style={{ border: "1px solid #94a3b8", padding: "1px" }}>
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #94a3b8", padding: "15px 20px" }}>
                <div style={{ width: "15%", display: "flex", justifyContent: "center" }}>
                  <img
                    src={printableIsJournalsPub ? "/journalspub-logo.png" : "/stmlogo.png"}
                    alt={printableCompanyName}
                    style={{ maxHeight: "65px", objectFit: "contain" }}
                  />
                </div>
                <div style={{ width: "85%", textAlign: "center", paddingRight: "10%" }}>
                  <h1 style={{ fontSize: "34px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "0.5px" }}>{printableCompanyName}</h1>
                  <p style={{ fontSize: "12px", fontWeight: "600", margin: "0", color: "#334155" }}>{printableCompanyLines[0]}</p>
                  <p style={{ fontSize: "11px", fontWeight: "700", margin: "4px 0 0 0", color: "#1e293b", letterSpacing: "0.04em" }}>PROFORMA INVOICE</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{printableCompanyLines[1]}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #94a3b8" }}>
                <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" }}>PROFORMA INVOICE NUMBER :</span>
                  <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>{printablePiNumber}</div>

                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" }}>PROFORMA INVOICE DATE :</span>
                  <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>{new Date(printablePi.createdAt).toLocaleDateString()}</div>

                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" }}>STATUS :</span>
                  <div style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb", margin: "4px 0 0 0" }}>{printablePi.status}</div>
                </div>
                <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8", fontSize: "11px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569", display: "block", marginBottom: "6px" }}>BILL TO:</span>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "4px 2px" }}>
                    <strong style={{ color: "#475569" }}>Org :</strong> <span>{printablePi.organization || "-"}</span>
                    <strong style={{ color: "#475569" }}>Contact :</strong> <span>{printablePi.contactName || "-"}</span>
                    <strong style={{ color: "#475569" }}>Email :</strong> <span>{printablePi.email || "-"}</span>
                    <strong style={{ color: "#475569" }}>Phone :</strong> <span>{printablePi.phone || "-"}</span>
                    <strong style={{ color: "#475569" }}>Address :</strong> <span>{printablePi.address || "-"}</span>
                  </div>
                </div>
                <div style={{ padding: "12px 15px", fontSize: "11px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "8px 2px" }}>
                    <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>GSTIN :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{printablePi.gstNumber || "-"}</span>
                    <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>CATEGORY :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{printablePi.subscriberCategory || "-"}</span>
                    <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>INSTITUTION :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{printablePi.institutionName || "-"}</span>
                    <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>COUPON :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{printablePi.couponCode ? `${printablePi.couponCode} (${printablePi.couponPercent || 0}%)` : "Not Used"}</span>
                  </div>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #94a3b8" }} cellPadding="6">
                <thead>
                  <tr style={{ borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontSize: "10.5px", fontWeight: "800" }}>
                    <th style={{ width: "7%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>Sr.No</th>
                    <th style={{ width: "53%", borderRight: "1px solid #94a3b8", textAlign: "left" }}>Particulars</th>
                    <th style={{ width: "18%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>Plan</th>
                    <th style={{ width: "22%", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printablePi.items.map((it, idx) => (
                    <tr key={it.id} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "11.5px" }}>
                      <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center", color: "#475569" }}>{idx + 1}</td>
                      <td style={{ borderRight: "1px solid #94a3b8", textAlign: "left", fontWeight: "600", color: "#1e293b", lineHeight: "1.3", padding: "8px 6px" }}>
                        {it.journalName}
                        <div style={{ fontSize: "9px", fontWeight: "400", color: "#64748b", marginTop: "2px" }}>
                          {it.subject || ""}
                        </div>
                      </td>
                      <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center" }}>
                        {it.selectedPlan === "PRINT_ONLINE" ? "PRINT + DIGITAL" : it.selectedPlan}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "700", color: "#0f172a" }}>₹{it.unitPrice.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ borderRight: "1px solid #94a3b8", borderTop: "1px solid #94a3b8", verticalAlign: "top", padding: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#334155" }}>
                        <strong style={{ color: "#0f172a" }}>In Words:</strong> {printableTotal ? `Indian Rupees ${printableTotal.toLocaleString("en-IN")} Only` : "-"}
                      </div>
                    </td>
                    <td colSpan={2} style={{ borderTop: "1px solid #94a3b8", padding: "0" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "4px", padding: "10px", fontSize: "11.5px" }}>
                        <span style={{ textAlign: "right", color: "#64748b" }}>Subtotal:</span>
                        <span style={{ textAlign: "right", fontWeight: "600" }}>{printableCurrency} {printableSubtotal.toLocaleString("en-IN")}</span>

                        {printableDiscount > 0 ? (
                          <>
                            <span style={{ textAlign: "right", color: "#64748b" }}>Discount:</span>
                            <span style={{ textAlign: "right", color: "#ef4444" }}>-{printableCurrency} {printableDiscount.toLocaleString("en-IN")}</span>
                          </>
                        ) : null}

                        {printableGst > 0 ? (
                          <>
                            <span style={{ textAlign: "right", color: "#64748b" }}>GST ({printableGstRate}%):</span>
                            <span style={{ textAlign: "right" }}>{printableCurrency} {printableGst.toLocaleString("en-IN")}</span>
                          </>
                        ) : null}

                        <span style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px", fontSize: "13px" }}>Total ({printableCurrency}):</span>
                        <span style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px", fontSize: "13px" }}>{printableTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {printablePi.adminRemarks ? (
                <div style={{ padding: "12px 15px", borderBottom: "1px solid #94a3b8", fontSize: "11px", color: "#334155" }}>
                  <strong style={{ color: "#1e293b" }}>Remark:</strong> {printablePi.adminRemarks}
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", padding: "15px" }}>
                <div>
                  <strong style={{ fontSize: "10px", textDecoration: "underline", textTransform: "uppercase", display: "block", marginBottom: "6px", color: "#1e293b" }}>TERMS & CONDITIONS:</strong>
                  <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "10.5px", color: "#475569", lineHeight: "1.6" }}>
                    <li>All subscription amount mentioned is as per year fee (Between January and December).</li>
                    <li>Missing numbers will not be supplied if claims are received more than six months.</li>
                    <li>The Publisher cannot accept responsibly for foreign delivery when records indicate posting has been made.</li>
                    <li>Invoice subject to realization of demand draft/cheque.</li>
                  </ol>
                </div>
                <SignatureBlock brandTitle={printableCompanyName} />
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
