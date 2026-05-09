"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

type Journal = {
  serialNo: number;
  subject: string;
  journalName: string;
  abbreviation: string;
  issn: string | null;
  frequency: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  printUsd: number;
  onlineUsd: number;
  combinedUsd: number;
};

type Plan = "PRINT" | "ONLINE" | "PRINT_ONLINE";

type Props = {
  journals: Journal[];
  canUsePubSubscription: boolean;
};

export default function ProformaQuoteClient({ journals, canUsePubSubscription }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quoteId, setQuoteId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [organization, setOrganization] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [designation, setDesignation] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [country, setCountry] = useState("India");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<"STM" | "PUB">("STM");
  const [subscriberCategory, setSubscriberCategory] = useState<"COLLEGE" | "AGENCY" | "SCHOLAR">("COLLEGE");
  const [shippingRecipientName, setShippingRecipientName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingInstitute, setShippingInstitute] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingCountry, setShippingCountry] = useState("India");
  const [shippingPhone, setShippingPhone] = useState("");

  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("All Subjects");
  const [coupon, setCoupon] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [plans, setPlans] = useState<Record<number, Plan>>({});
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const subjects = useMemo(() => {
    const s = new Set(journals.map((j) => j.subject));
    return ["All Subjects", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [journals]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return journals.filter((j) => {
      const byDomain = domain === "All Subjects" || j.subject === domain;
      if (!byDomain) return false;
      if (!q) return true;
      const hay = `${j.journalName} ${j.subject} ${j.abbreviation} ${j.issn || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [journals, keyword, domain]);

  const selectedRows = useMemo(() => journals.filter((j) => selected[j.serialNo]), [journals, selected]);

  function getPrice(j: Journal, plan: Plan) {
    if (currency === "INR") {
      if (plan === "ONLINE") return j.onlineInr;
      if (plan === "PRINT_ONLINE") return j.combinedInr;
      return j.printInr;
    }
    if (plan === "ONLINE") return j.onlineUsd;
    if (plan === "PRINT_ONLINE") return j.combinedUsd;
    return j.printUsd;
  }

  const subtotal = useMemo(
    () => selectedRows.reduce((sum, row) => sum + getPrice(row, plans[row.serialNo] || "PRINT"), 0),
    [selectedRows, plans, currency]
  );
  const discount = Math.round((subtotal * appliedDiscountPercent) / 100);
  const gst = currency === "INR" ? Math.round(subtotal * 0.18) : 0;
  const grandTotal = subtotal - discount + gst;

  function fmt(amount: number) {
    return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount.toLocaleString("en-US")}`;
  }

  async function onSaveStepOne(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const endpoint = quoteId && !quoteId.startsWith("draft-") ? `/api/proforma/${quoteId}/subscriber` : "/api/proforma";
    const method = quoteId && !quoteId.startsWith("draft-") ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organization: organization || institutionName,
        contactName,
        email,
        phone,
        country,
        address: `${address}${city ? `, ${city}` : ""}${stateName ? `, ${stateName}` : ""}${pincode ? ` - ${pincode}` : ""}`,
        gstNumber,
        currency
      })
    });

    const json = (await res.json()) as { ok: boolean; error?: string; quoteId?: string };
    setSaving(false);

    if (!json.ok || !json.quoteId) {
      setError(json.error || "Failed to save details.");
      return;
    }

    setQuoteId(json.quoteId);
    setStep(2);
  }

  async function onSubmitQuote() {
    if (!quoteId) return;
    setError("");
    setSubmitting(true);

    const items = selectedRows.map((row) => {
      const selectedPlan = plans[row.serialNo] || "PRINT";
      return {
        serialNo: row.serialNo,
        subject: row.subject,
        journalName: row.journalName,
        abbreviation: row.abbreviation,
        issn: row.issn,
        selectedPlan,
        unitPrice: getPrice(row, selectedPlan)
      };
    });

    const res = await fetch(`/api/proforma/${quoteId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currency,
        items,
        couponCode: appliedCouponCode || null,
        couponPercent: appliedDiscountPercent
      })
    });

    const json = (await res.json()) as { ok: boolean; error?: string };
    setSubmitting(false);

    if (!json.ok) {
      setError(json.error || "Failed to submit quote.");
      return;
    }

    setStep(3);
  }

  async function onApplyCoupon() {
    setCouponMessage("");
    const input = coupon.trim().toUpperCase();
    if (!input) {
      setAppliedCouponCode("");
      setAppliedDiscountPercent(0);
      return;
    }

    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(input)}`, { cache: "no-store" });
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      coupon?: { code: string; discount: number };
    };

    if (!json.ok || !json.coupon) {
      setAppliedCouponCode("");
      setAppliedDiscountPercent(0);
      setCouponMessage(json.error || "Invalid coupon");
      return;
    }

    setAppliedCouponCode(json.coupon.code);
    setAppliedDiscountPercent(json.coupon.discount);
    setCouponMessage(`Applied ${json.coupon.code} (${json.coupon.discount}% off)`);
  }

  function amountInWords(n: number) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const twoDigits = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`);
    const threeDigits = (x: number) => {
      const h = Math.floor(x / 100);
      const r = x % 100;
      if (!h) return twoDigits(r);
      return `${ones[h]} Hundred${r ? ` ${twoDigits(r)}` : ""}`;
    };

    if (n === 0) return "Zero";
    if (n > 99999999) return `${n.toLocaleString("en-IN")}`;

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;
    const parts: string[] = [];
    if (crore) parts.push(`${twoDigits(crore)} Crore`);
    if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
    if (rest) parts.push(threeDigits(rest));
    return parts.join(" ");
  }

  function onDownloadInvoicePdf() {
    const doc = new jsPDF();
    doc.setFillColor(245, 248, 255);
    doc.roundedRect(10, 10, 190, 277, 4, 4, "F");
    doc.setDrawColor(210, 220, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 15, 180, 35, 3, 3, "FD");
    doc.setFontSize(9);
    doc.setTextColor(89, 111, 150);
    doc.text("QUOTATION NUMBER", 20, 23);
    doc.setFontSize(11);
    doc.setTextColor(22, 52, 104);
    doc.text(quoteId || "DRAFT", 20, 29);
    doc.setFontSize(9);
    doc.setTextColor(89, 111, 150);
    doc.text("ISSUE DATE", 20, 36);
    doc.text(new Date().toLocaleDateString("en-IN"), 20, 41);
    doc.text("BANK DETAILS", 90, 23);
    doc.setTextColor(22, 52, 104);
    doc.text("HDFC BANK LTD | IFSC: HDFC0000549", 90, 30);
    doc.text("A/C: 639400000000153", 90, 36);
    doc.text("LEGAL IDENTIFIERS", 145, 23);
    doc.text("GSTIN: 09AAACC...", 145, 30);
    doc.text("PAN: AAACC...", 145, 36);

    doc.setFontSize(16);
    doc.setTextColor(16, 35, 73);
    doc.text("PROFORMA INVOICE", 15, 59);
    doc.setFontSize(11);
    doc.setTextColor(71, 90, 122);
    doc.text(`Receiver: ${contactName}`, 15, 66);
    doc.text(`${institutionName || organization}`, 15, 72);

    autoTable(doc, {
      startY: 80,
      head: [["SR.NO", "DEPARTMENT", "DURATION", "BASE PRICE"]],
      body: selectedRows.map((row, idx) => {
        const plan = plans[row.serialNo] || "PRINT";
        const price = getPrice(row, plan);
        return [idx + 1, row.journalName, plan === "PRINT_ONLINE" ? "Yearly" : plan === "ONLINE" ? "Digital" : "Yearly", fmt(price)];
      }),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [14, 34, 76], textColor: [255, 255, 255] }
    });

    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 80;
    doc.setFontSize(10);
    doc.setTextColor(67, 88, 120);
    doc.text(`Subtotal (Base Price Total): ${fmt(subtotal)}`, 120, finalY + 12);
    doc.text(`Total GST (18%): ${fmt(gst)}`, 120, finalY + 18);
    doc.text(`Discount ${appliedCouponCode ? `(${appliedCouponCode})` : ""}: ${fmt(discount)}`, 120, finalY + 24);
    doc.setFontSize(13);
    doc.setTextColor(11, 48, 145);
    doc.text(`GRAND TOTAL: ${fmt(grandTotal)}`, 120, finalY + 33);
    doc.setFontSize(10);
    doc.setTextColor(31, 47, 79);
    doc.text(`Amount in words: ${amountInWords(grandTotal)} ${currency === "INR" ? "Rupees Only" : "US Dollars Only"}`, 15, finalY + 44);

    doc.save(`proforma-invoice-${quoteId || "draft"}.pdf`);
  }

  return (
    <main className="proforma-page">
      <h1 className="proforma-title">Institutional Proforma System</h1>
      <p className="proforma-subtitle">Generate GST-compliant institutional quotations.</p>

      <div className="proforma-steps">
        <span className={step === 1 ? "active" : ""}><i>1</i> SUBSCRIBER INFO</span>
        <span className={step === 2 ? "active" : ""}><i>2</i> JOURNAL CART</span>
        <span className={step === 3 ? "active" : ""}><i>3</i> PREVIEW</span>
      </div>

      {step === 1 ? (
        <section className="proforma-card proforma-step-one">
          <h2>Subscriber Info</h2>
          {error ? <p className="auth-error">{error}</p> : null}
          <form className="proforma-form" onSubmit={onSaveStepOne}>
            <label className="proforma-label">Select Subscription Type *</label>
            <div className="proforma-pill-row proforma-full">
              <label className={`proforma-pill-option ${subscriptionType === "STM" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="subscriptionType"
                  value="STM"
                  checked={subscriptionType === "STM"}
                  onChange={() => setSubscriptionType("STM")}
                />
                <span>STM Journals Subscription</span>
              </label>
              {canUsePubSubscription ? (
                <label className={`proforma-pill-option ${subscriptionType === "PUB" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="subscriptionType"
                    value="PUB"
                    checked={subscriptionType === "PUB"}
                    onChange={() => setSubscriptionType("PUB")}
                  />
                  <span>Journals Pub Subscription</span>
                </label>
              ) : null}
            </div>

            <label className="proforma-label">Subscriber Category *</label>
            <div className="proforma-pill-row proforma-full">
              <label className={`proforma-pill-option ${subscriberCategory === "COLLEGE" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="subscriberCategory"
                  value="COLLEGE"
                  checked={subscriberCategory === "COLLEGE"}
                  onChange={() => setSubscriberCategory("COLLEGE")}
                />
                <span>College / University</span>
              </label>
              <label className={`proforma-pill-option ${subscriberCategory === "AGENCY" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="subscriberCategory"
                  value="AGENCY"
                  checked={subscriberCategory === "AGENCY"}
                  onChange={() => setSubscriberCategory("AGENCY")}
                />
                <span>Subscription Agency</span>
              </label>
              <label className={`proforma-pill-option ${subscriberCategory === "SCHOLAR" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="subscriberCategory"
                  value="SCHOLAR"
                  checked={subscriberCategory === "SCHOLAR"}
                  onChange={() => setSubscriberCategory("SCHOLAR")}
                />
                <span>Individual Scholar</span>
              </label>
            </div>

            <h3 className="proforma-section-title proforma-full">Billing Details</h3>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Name *" required />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" required />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone *" required />
            <input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="Institution Name *" required />
            <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Designation" />
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Organization" />
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Billing Address *" required className="proforma-full" />
            <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" />
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GSTIN Optional" />

            <div className="proforma-currency-line proforma-full">
              <span>Currency</span>
              <button type="button" className={currency === "INR" ? "active" : ""} onClick={() => setCurrency("INR")}>INR</button>
              <button type="button" className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")}>USD</button>
            </div>

            <h3 className="proforma-section-title proforma-full">Shipping Details</h3>
            <label className="proforma-checkbox proforma-full">
              <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} />
              <span>Same as Billing</span>
            </label>

            {!sameAsBilling ? (
              <>
                <input
                  value={shippingRecipientName}
                  onChange={(e) => setShippingRecipientName(e.target.value)}
                  placeholder="Recipient Name"
                  className="proforma-full"
                />
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Shipping Address"
                  className="proforma-full"
                />
                <input
                  value={shippingInstitute}
                  onChange={(e) => setShippingInstitute(e.target.value)}
                  placeholder="Institute / Organization"
                />
                <input
                  value={shippingPincode}
                  onChange={(e) => setShippingPincode(e.target.value)}
                  placeholder="Pincode"
                />
                <input
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="City"
                />
                <input
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="State"
                />
                <input
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  placeholder="India"
                />
                <input
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="Shipping Phone"
                />
              </>
            ) : null}

            <div className="proforma-actions-row proforma-full">
              <button className="proforma-cta" type="submit" disabled={saving}>{saving ? "Saving..." : "Continue to Journal Cart →"}</button>
            </div>
          </form>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="proforma-step-two">
          <div className="proforma-grid">
            <div className="proforma-main">
              <button type="button" className="proforma-edit-link" onClick={() => setStep(1)}>← Edit Subscriber Info</button>
              <h2>Select Publications</h2>

              <div className="proforma-coupon-row">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter coupon code" />
                <button type="button" onClick={onApplyCoupon}>Apply Coupon</button>
              </div>
              {couponMessage ? <p className="proforma-coupon-msg">{couponMessage}</p> : null}

              <div className="proforma-filters">
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Title, ISSN or Keyword..." />
                <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="proforma-list">
                {filtered.map((j) => {
                  const plan = plans[j.serialNo] || "PRINT";
                  const price = getPrice(j, plan);
                  return (
                    <div className="proforma-row" key={j.serialNo}>
                      <input type="checkbox" checked={!!selected[j.serialNo]} onChange={(e) => setSelected((prev) => ({ ...prev, [j.serialNo]: e.target.checked }))} />
                      <div className="proforma-row-title">
                        <strong>{j.journalName}</strong>
                        <div>
                          <span className="proforma-tag">{j.subject}</span>
                          <span>ISSN: {j.issn || "-"}</span>
                          <span>{j.frequency || "3 Issues"}</span>
                        </div>
                      </div>
                      <select value={plan} onChange={(e) => setPlans((prev) => ({ ...prev, [j.serialNo]: e.target.value as Plan }))}>
                        <option value="PRINT">Print</option>
                        <option value="ONLINE">Online</option>
                        <option value="PRINT_ONLINE">Print + Online</option>
                      </select>
                      <div className="proforma-row-price">{fmt(price)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="proforma-bottom-bar">
                <div>Final Total including +18% GST <strong>{fmt(grandTotal)}</strong></div>
                <button type="button" className="proforma-cta" onClick={onSubmitQuote} disabled={submitting || selectedRows.length === 0}>
                  {submitting ? "Building..." : "Build Proforma ⚡"}
                </button>
              </div>
            </div>

            <aside className="proforma-summary">
              <h3>Quote Summary</h3>
              <p><span>Subtotal</span><strong>{fmt(subtotal)}</strong></p>
              <p><span>Discount</span><strong>{fmt(discount)}</strong></p>
              <p><span>GST (+18%)</span><strong>{fmt(gst)}</strong></p>
              <p className="grand"><span>{currency === "INR" ? "₹" : "$"}{grandTotal.toLocaleString(currency === "INR" ? "en-IN" : "en-US")}</span></p>
              <p className="selected-count">{selectedRows.length} Selected</p>
              <button className="proforma-review-btn" onClick={onSubmitQuote} disabled={submitting || selectedRows.length === 0}>
                Review Quotation →
              </button>
              {error ? <p className="auth-error">{error}</p> : null}
            </aside>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="proforma-preview-wrap">
          <article className="proforma-invoice">
            <section className="proforma-quote-meta">
              <div>
                <h5>Quotation Number</h5>
                <strong>{quoteId || "DRAFT"}</strong>
                <h5>Issue Date</h5>
                <p>{new Date().toLocaleDateString("en-IN")}</p>
              </div>
              <div>
                <h5>Bank Details (NEFT/RTGS)</h5>
                <p>Bank: HDFC Bank</p>
                <p>A/C: 639400000001153</p>
                <p>IFSC: HDFC0000549</p>
                <p>Holder: Consortium eLearning Network Pvt. Ltd.</p>
              </div>
              <div>
                <h5>Legal Identifiers</h5>
                <p>GSTIN: 09AAACC...</p>
                <p>PAN: AAACC...</p>
                <p>CIN: U80302DL2005PTC138759</p>
              </div>
            </section>

            <header className="proforma-invoice-head">
              <div>
                <h2>{contactName}</h2>
                <p>{institutionName || organization}</p>
                <p>{city}{stateName ? `, ${stateName}` : ""}{pincode ? ` - ${pincode}` : ""}</p>
              </div>
              <div className="proforma-subscription-summary">
                <h5>Subscription Summary</h5>
                <p>Category: {subscriberCategory === "COLLEGE" ? "College / University" : subscriberCategory === "AGENCY" ? "Subscription Agency" : "Individual Scholar"}</p>
                <p>Duration Plan: Yearly</p>
                <p>{selectedRows.length} Department(s)</p>
              </div>
            </header>

            <section className="proforma-meta-grid">
              <div>
                <h4>BILLED TO</h4>
                <p>{institutionName || organization}</p>
                <p>Attn: {contactName}</p>
                <p>{email}</p>
              </div>
              <div>
                <h4>BANK DETAILS</h4>
                <p>Bank: HDFC BANK LTD</p>
                <p>A/C No: 502000000000</p>
                <p>IFSC: HDFC0000001</p>
                <p>Branch: NOIDA SECTOR 18</p>
              </div>
            </section>

            <table className="proforma-invoice-table">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>PUBLICATION</th>
                  <th>FORMAT</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {selectedRows.map((row, idx) => {
                  const plan = plans[row.serialNo] || "PRINT";
                  const price = getPrice(row, plan);
                  const format = plan === "PRINT_ONLINE" ? "Print + Online" : plan === "ONLINE" ? "Online" : "Print";
                  return (
                    <tr key={row.serialNo}>
                      <td>{idx + 1}</td>
                      <td>{row.journalName}</td>
                      <td>{format}</td>
                      <td>{fmt(price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="proforma-totals">
              <p><span>Subtotal</span><strong>{fmt(subtotal)}</strong></p>
              <p><span>Discount {appliedCouponCode ? `(${appliedCouponCode})` : ""}</span><strong>{fmt(discount)}</strong></p>
              <p><span>Taxable Value</span><strong>{fmt(subtotal - discount)}</strong></p>
              <p><span>GST +18%</span><strong>{fmt(gst)}</strong></p>
              <p className="grand"><span>Grand Total</span><strong>{fmt(grandTotal)}</strong></p>
            </div>

            <p className="proforma-words">
              Amount in Words: <strong>{amountInWords(grandTotal)} {currency === "INR" ? "Rupees Only" : "US Dollars Only"}</strong>
            </p>

            <ol className="proforma-notes">
              <li>Subscription will be activated post payment confirmation.</li>
              <li>All disputes are subject to Delhi jurisdiction only.</li>
              <li>18% GST applicable as per Government of India rules.</li>
              <li>Quotation is valid for 30 days.</li>
            </ol>
          </article>

            <div className="proforma-preview-actions">
            <button className="catalogues-ghost" onClick={() => setStep(2)}>← Edit</button>
            <button className="catalogues-primary" onClick={onDownloadInvoicePdf}>⬇ Download PDF</button>
            <button className="catalogues-ghost" onClick={() => alert("Email integration can be connected next.")}>✉ Send Email</button>
            <button
              className="catalogues-primary"
              onClick={() =>
                router.push(
                  `/checkout?quoteId=${encodeURIComponent(quoteId || "DRAFT")}&total=${encodeURIComponent(String(grandTotal))}&name=${encodeURIComponent(contactName)}&email=${encodeURIComponent(email)}&organization=${encodeURIComponent(institutionName || organization)}&address=${encodeURIComponent(address)}&state=${encodeURIComponent(stateName)}&pincode=${encodeURIComponent(pincode)}&gst=${encodeURIComponent(gstNumber)}&subject=${encodeURIComponent(selectedRows[0]?.subject || "Subscription")}`
                )
              }
            >
              ⚡ Pay Now
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
