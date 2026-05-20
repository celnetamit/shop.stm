"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

type Journal = {
  serialNo: number;
  subject: string;
  journalName: string;
  abbreviation: string | null;
  issn: string | null;
  frequency: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  printUsd: number;
  onlineUsd: number;
  combinedUsd: number;
  publisher: string | null;
  imprint: string | null;
  address: string | null;
  publisherEmail: string | null;
  publisherContactNumber: string | null;
};

type Plan = "PRINT" | "ONLINE" | "PRINT_ONLINE";

type SubscriptionConfig = {
  id: string;
  type: "ANNUAL" | "ISSUE_WISE";
  year: number;
  plan: Plan;
  selectedIssues: number[];
};

function getIssueLabels(totalIssues: number): string[] {
  if (totalIssues === 2) {
    return ["Issue 1 (Jan-Jun)", "Issue 2 (Jul-Dec)"];
  }
  if (totalIssues === 3) {
    return ["Issue 1 (Jan-Apr)", "Issue 2 (May-Aug)", "Issue 3 (Sep-Dec)"];
  }
  if (totalIssues === 4) {
    return ["Issue 1 (Jan-Mar)", "Issue 2 (Apr-Jun)", "Issue 3 (Jul-Sep)", "Issue 4 (Oct-Dec)"];
  }
  if (totalIssues === 6) {
    return [
      "Issue 1 (Jan-Feb)",
      "Issue 2 (Mar-Apr)",
      "Issue 3 (May-Jun)",
      "Issue 4 (Jul-Aug)",
      "Issue 5 (Sep-Oct)",
      "Issue 6 (Nov-Dec)"
    ];
  }
  if (totalIssues === 12) {
    return [
      "Issue 1 (Jan)",
      "Issue 2 (Feb)",
      "Issue 3 (Mar)",
      "Issue 4 (Apr)",
      "Issue 5 (May)",
      "Issue 6 (Jun)",
      "Issue 7 (Jul)",
      "Issue 8 (Aug)",
      "Issue 9 (Sep)",
      "Issue 10 (Oct)",
      "Issue 11 (Nov)",
      "Issue 12 (Dec)"
    ];
  }
  return Array.from({ length: totalIssues }, (_, i) => `Issue ${i + 1}`);
}

type Props = {
  journals: Journal[];
  canUsePubSubscription: boolean;
};

function isBookProduct(journalName: string, subject: string): boolean {
  const lowerName = journalName.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  return (
    lowerSubject.includes("book") ||
    lowerSubject.includes("monograph") ||
    lowerSubject.includes("nstc") ||
    lowerName.includes("book") ||
    lowerName.includes("monograph") ||
    lowerName.includes("handbook") ||
    lowerName.includes("textbook") ||
    lowerName.includes("reference book")
  );
}

function getIssueCountFromFrequency(frequency: string | null): number {
  if (!frequency) return 2;
  const cleaned = frequency.trim().toLowerCase();
  if (cleaned.includes("bi-annual") || cleaned.includes("biannual")) return 2;
  const match = cleaned.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 2;
}

function isJournalsPubPublisher(publisher: string | null | undefined): boolean {
  const normalized = (publisher || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized === "journalspub";
}

function getIssueMonthRange(totalIssues: number, issueNum: number): { startMonth: number; endMonth: number } {
  if (totalIssues === 2) return issueNum === 1 ? { startMonth: 1, endMonth: 6 } : { startMonth: 7, endMonth: 12 };
  if (totalIssues === 3) {
    if (issueNum === 1) return { startMonth: 1, endMonth: 4 };
    if (issueNum === 2) return { startMonth: 5, endMonth: 8 };
    return { startMonth: 9, endMonth: 12 };
  }
  if (totalIssues === 4) {
    const startMonth = (issueNum - 1) * 3 + 1;
    return { startMonth, endMonth: Math.min(12, startMonth + 2) };
  }
  if (totalIssues === 6) {
    const startMonth = (issueNum - 1) * 2 + 1;
    return { startMonth, endMonth: Math.min(12, startMonth + 1) };
  }
  if (totalIssues === 12) return { startMonth: issueNum, endMonth: issueNum };
  const span = Math.max(1, Math.floor(12 / Math.max(1, totalIssues)));
  const startMonth = (issueNum - 1) * span + 1;
  return { startMonth, endMonth: Math.min(12, startMonth + span - 1) };
}

function monthShort(month: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1] || "";
}

export default function ProformaQuoteClient({ journals, canUsePubSubscription }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quoteId, setQuoteId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState("");
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
  const [remarks, setRemarks] = useState("");

  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("All Subjects");
  const [coupon, setCoupon] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [subscriptionConfigs, setSubscriptionConfigs] = useState<Record<number, SubscriptionConfig[]>>({});

  const getConfigsForJournal = (serialNo: number, frequency: string | null): SubscriptionConfig[] => {
    const totalIssues = getIssueCountFromFrequency(frequency);
    if (!subscriptionConfigs[serialNo] || subscriptionConfigs[serialNo].length === 0) {
      return [
        {
          id: `initial-${serialNo}`,
          type: "ANNUAL",
          year: 2025,
          plan: "PRINT",
          selectedIssues: Array.from({ length: totalIssues }, (_, i) => i + 1)
        }
      ];
    }
    return subscriptionConfigs[serialNo];
  };

  const addConfigForJournal = (serialNo: number, frequency: string | null) => {
    const totalIssues = getIssueCountFromFrequency(frequency);
    const current = getConfigsForJournal(serialNo, frequency);
    
    const lastYear = current.length > 0 ? Math.max(...current.map(c => c.year)) : 2025;
    const nextYear = lastYear + 1;

    const newConfig: SubscriptionConfig = {
      id: `${serialNo}-${Date.now()}-${Math.random()}`,
      type: "ANNUAL",
      year: nextYear <= 2027 ? nextYear : 2025,
      plan: "PRINT",
      selectedIssues: Array.from({ length: totalIssues }, (_, i) => i + 1)
    };

    setSubscriptionConfigs(prev => ({
      ...prev,
      [serialNo]: [...current, newConfig]
    }));
  };

  const removeConfigForJournal = (serialNo: number, configId: string, frequency: string | null) => {
    const current = getConfigsForJournal(serialNo, frequency);
    if (current.length <= 1) return;
    setSubscriptionConfigs(prev => ({
      ...prev,
      [serialNo]: current.filter(c => c.id !== configId)
    }));
  };

  const updateConfigForJournal = (serialNo: number, configId: string, updated: Partial<SubscriptionConfig>, frequency: string | null) => {
    const current = getConfigsForJournal(serialNo, frequency);
    setSubscriptionConfigs(prev => ({
      ...prev,
      [serialNo]: current.map(c => {
        if (c.id !== configId) return c;
        const newC = { ...c, ...updated };
        if (updated.type === "ANNUAL") {
          const totalIssues = getIssueCountFromFrequency(frequency);
          newC.selectedIssues = Array.from({ length: totalIssues }, (_, i) => i + 1);
        }
        return newC;
      })
    }));
  };

  const visibleJournals = useMemo(() => {
    if (!canUsePubSubscription) return journals;
    if (subscriptionType === "PUB") {
      return journals.filter((j) => isJournalsPubPublisher(j.publisher));
    }
    return journals.filter((j) => !isJournalsPubPublisher(j.publisher));
  }, [journals, canUsePubSubscription, subscriptionType]);

  useEffect(() => {
    setSelected({});
    setSubscriptionConfigs({});
    setDomain("All Subjects");
    setKeyword("");
  }, [subscriptionType]);

  const subjects = useMemo(() => {
    const s = new Set(visibleJournals.map((j) => j.subject));
    return ["All Subjects", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [visibleJournals]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return visibleJournals.filter((j) => {
      const byDomain = domain === "All Subjects" || j.subject === domain;
      if (!byDomain) return false;
      if (!q) return true;
      const hay = `${j.journalName} ${j.subject} ${j.abbreviation} ${j.issn || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [visibleJournals, keyword, domain]);

  const selectedRows = useMemo(() => visibleJournals.filter((j) => selected[j.serialNo]), [visibleJournals, selected]);

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

  async function handlePincodeLookup(val: string, isShipping: boolean) {
    if (isShipping) setShippingPincode(val); else setPincode(val);
    const pin = val.trim();
    if (pin.length !== 6 || !/^\d+$/.test(pin)) return;

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const resolvedCity = postOffice.District;
        const resolvedState = postOffice.State;

        if (isShipping) {
          setShippingCity(resolvedCity);
          setShippingState(resolvedState);
          setShippingCountry("India");
        } else {
          setCity(resolvedCity);
          setStateName(resolvedState);
          setCountry("India");
        }
      }
    } catch (e) {
      console.warn("PIN code lookup failed: ", e);
    }
  }

  const itemizedTotals = useMemo(() => {
    const list: Array<{
      row: Journal;
      plan: Plan;
      unitPrice: number;
      itemDiscount: number;
      itemTaxable: number;
      gstRate: number;
      itemGst: number;
      netAmount: number;
      selectedIssues: number;
      totalIssues: number;
      hsn: string;
      year: number;
      type: "ANNUAL" | "ISSUE_WISE";
      selectedIssuesList: number[];
      periodStart: number;
      periodEnd: number;
    }> = [];

    selectedRows.forEach((row) => {
      const totalIssues = getIssueCountFromFrequency(row.frequency);
      const configs = getConfigsForJournal(row.serialNo, row.frequency);

      configs.forEach((c) => {
        const plan = c.plan;
        const annualPrice = getPrice(row, plan);
        const selectedCount = c.type === "ANNUAL" ? totalIssues : c.selectedIssues.length;
        const unitPrice = (annualPrice / totalIssues) * selectedCount;

        const itemDiscount = (unitPrice * appliedDiscountPercent) / 100;
        const itemTaxable = unitPrice - itemDiscount;
        const isDigital = plan === "ONLINE" || plan === "PRINT_ONLINE";
        const gstRate = currency === "INR" && isDigital ? 18 : 0;
        const itemGst = itemTaxable * (gstRate / 100);
        const netAmount = itemTaxable + itemGst;
        let periodStart = c.year * 12;
        let periodEnd = c.year * 12 + 11;
        if (c.type === "ISSUE_WISE" && c.selectedIssues.length > 0) {
          const ranges = c.selectedIssues.map((issueNum) => getIssueMonthRange(totalIssues, issueNum));
          const startMonth = Math.min(...ranges.map((r) => r.startMonth));
          const endMonth = Math.max(...ranges.map((r) => r.endMonth));
          periodStart = c.year * 12 + (startMonth - 1);
          periodEnd = c.year * 12 + (endMonth - 1);
        }

        list.push({
          row,
          plan,
          unitPrice,
          itemDiscount,
          itemTaxable,
          gstRate,
          itemGst,
          netAmount,
          selectedIssues: selectedCount,
          totalIssues,
          hsn: plan === "ONLINE"
            ? "998431"
            : isBookProduct(row.journalName, row.subject)
            ? "4901"
            : "4902",
          year: c.year,
          type: c.type,
          selectedIssuesList: c.selectedIssues,
          periodStart,
          periodEnd
        });
      });
    });

    return list;
  }, [selectedRows, subscriptionConfigs, currency, appliedDiscountPercent]);

  const mergedItemizedTotals = useMemo(() => {
    if (!itemizedTotals.length) return [];
    const sorted = [...itemizedTotals].sort((a, b) => {
      if (a.row.serialNo !== b.row.serialNo) return a.row.serialNo - b.row.serialNo;
      if (a.plan !== b.plan) return a.plan.localeCompare(b.plan);
      return a.periodStart - b.periodStart;
    });
    const merged: Array<(typeof itemizedTotals)[number] & { rangeLabel: string }> = [];
    for (const current of sorted) {
      const last = merged[merged.length - 1];
      const canMerge =
        !!last &&
        last.row.serialNo === current.row.serialNo &&
        last.plan === current.plan &&
        last.hsn === current.hsn &&
        current.periodStart <= last.periodEnd + 1;
      if (canMerge && last) {
        last.unitPrice += current.unitPrice;
        last.itemDiscount += current.itemDiscount;
        last.itemTaxable += current.itemTaxable;
        last.itemGst += current.itemGst;
        last.netAmount += current.netAmount;
        last.periodEnd = Math.max(last.periodEnd, current.periodEnd);
        last.type = "ISSUE_WISE";
      } else {
        merged.push({ ...current, rangeLabel: "" });
      }
    }
    return merged.map((it) => {
      const startYear = Math.floor(it.periodStart / 12);
      const startMonth = (it.periodStart % 12) + 1;
      const endYear = Math.floor(it.periodEnd / 12);
      const endMonth = (it.periodEnd % 12) + 1;
      const rangeLabel =
        startYear === endYear && startMonth === 1 && endMonth === 12
          ? `${startYear}`
          : `${monthShort(startMonth)} ${startYear} to ${monthShort(endMonth)} ${endYear}`;
      return { ...it, rangeLabel };
    });
  }, [itemizedTotals]);

  const subtotal = useMemo(() => itemizedTotals.reduce((sum, item) => sum + item.unitPrice, 0), [itemizedTotals]);
  const discount = useMemo(() => itemizedTotals.reduce((sum, item) => sum + item.itemDiscount, 0), [itemizedTotals]);
  const taxable = useMemo(() => itemizedTotals.reduce((sum, item) => sum + item.itemTaxable, 0), [itemizedTotals]);
  const gst = useMemo(() => itemizedTotals.reduce((sum, item) => sum + item.itemGst, 0), [itemizedTotals]);
  const grandTotal = taxable + gst;

  function fmt(amount: number) {
    const fixed = Number(amount).toFixed(2);
    return currency === "INR" ? `₹${fixed}` : `$${fixed}`;
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
        currency,
        remarks
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

    const items = mergedItemizedTotals.map((item) => {
      const formattedJournalName = `${item.row.journalName} (${item.rangeLabel} | ${item.plan === "PRINT_ONLINE" ? "Print + Digital" : item.plan === "ONLINE" ? "Digital" : "Print"})`;

      return {
        serialNo: item.row.serialNo,
        subject: item.row.subject,
        journalName: formattedJournalName,
        abbreviation: item.row.abbreviation || item.row.journalName.substring(0, 10),
        issn: item.row.issn,
        selectedPlan: item.plan,
        unitPrice: Math.round(item.unitPrice)
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

    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(input)}&subtotal=${subtotal}`, { cache: "no-store" });
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

  function amountInWords(val: number) {
    const n = Math.floor(val);
    const paise = Math.round((val - n) * 100);

    const toWords = (num: number) => {
      const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
      const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      const twoDigits = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`);
      const threeDigits = (x: number) => {
        const h = Math.floor(x / 100);
        const r = x % 100;
        if (!h) return twoDigits(r);
        return `${ones[h]} Hundred${r ? ` ${twoDigits(r)}` : ""}`;
      };

      if (num === 0) return "Zero";
      if (num > 99999999) return `${num.toLocaleString("en-IN")}`;

      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const rest = num % 1000;
      const parts: string[] = [];
      if (crore) parts.push(`${twoDigits(crore)} Crore`);
      if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
      if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
      if (rest) parts.push(threeDigits(rest));
      return parts.filter(Boolean).join(" ");
    };

    if (currency === "USD") {
      let str = `US Dollars ${toWords(n)}`;
      if (paise > 0) {
        str += ` and Cents ${toWords(paise)}`;
      }
      return str + " Only";
    }

    let str = `Indian Rupees ${toWords(n)}`;
    if (paise > 0) {
      str += ` and ${toWords(paise)} Paise`;
    }
    return str + " Only";
  }

  async function onDownloadInvoicePdf() {
    const input = document.getElementById("invoice-capture-area");
    if (!input) return;
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      
      // Hide interactive action buttons if they are inside capturing tree,
      // though our DOM targeting is scoped to just the article.
      const canvas = await html2canvas(input, {
        scale: 2, // Retain absolute high-fidelity text/graphics
        useCORS: true, // Load external logos from URL without taint issues
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      // Establish Portrait A4 configuration (210mm x 297mm)
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Canvas absolute dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Compute exact fit-to-page ratios
      const ratio = Math.min(pdfWidth / (imgWidth / 3.7795275590551), pdfHeight / (imgHeight / 3.7795275590551)); // 3.779 is standard pixel-to-mm ratio
      
      // Scale the image dimensions with margins
      const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95; // Reduce slightly for margins
      const finalWidth = imgWidth * scale;
      const finalHeight = imgHeight * scale;
      
      // Center both horizontally and vertically on page
      const marginX = (pdfWidth - finalWidth) / 2;
      const marginY = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, "PNG", marginX, marginY, finalWidth, finalHeight);
      pdf.save(`proforma-${quoteId || "draft"}.pdf`);
    } catch (err) {
      console.error("Encountered html2canvas conversion error", err);
      // Resilience fallback to classic browser print flow
      window.print();
    }
  }

  async function onSendEmailNotification() {
    if (!quoteId || quoteId.startsWith("draft-")) return;
    setSendingEmail(true);
    setEmailSuccessMsg("");
    setError("");

    try {
      const response = await fetch(`/api/proforma/${quoteId}/notify`, { method: "POST" });
      const result = await response.json();
      if (result.ok) {
        setEmailSuccessMsg("Successfully dispatched emails to users and admins.");
      } else {
        setError(result.error || "Dispatched failed.");
      }
    } catch (e) {
      setError("Failed to connect to mail dispatcher.");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <main className="proforma-page">
      <h1 className="proforma-title">Institutional Proforma System</h1>
      <p className="proforma-subtitle">Generate GST-compliant institutional quotations.</p>

      <div className="proforma-steps">
        <span
          className={step === 1 ? "active" : ""}
          onClick={() => setStep(1)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setStep(1);
          }}
          style={{ cursor: "pointer" }}
        >
          <i>1</i> SUBSCRIBER INFO
        </span>
        <span
          className={step === 2 ? "active" : ""}
          onClick={() => {
            if (quoteId) setStep(2);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && quoteId) setStep(2);
          }}
          title={!quoteId ? "Complete Subscriber Info first" : "Edit Journal Cart"}
          style={{ cursor: quoteId ? "pointer" : "not-allowed" }}
        >
          <i>2</i> JOURNAL CART
        </span>
        <span
          className={step === 3 ? "active" : ""}
          onClick={() => {
            if (quoteId && itemizedTotals.length > 0) setStep(3);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && quoteId && itemizedTotals.length > 0) setStep(3);
          }}
          title={!quoteId || itemizedTotals.length === 0 ? "Build the quote first" : "Open Preview"}
          style={{ cursor: quoteId && itemizedTotals.length > 0 ? "pointer" : "not-allowed" }}
        >
          <i>3</i> PREVIEW
        </span>
      </div>

      {step === 1 ? (
        <section className="proforma-card proforma-step-one">
          <h2>Subscriber Info</h2>
          {error ? <p className="auth-error">{error}</p> : null}
          <form className="proforma-form" onSubmit={onSaveStepOne}>
            {canUsePubSubscription ? (
              <>
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
                </div>
              </>
            ) : null}

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
            <input value={pincode} onChange={(e) => handlePincodeLookup(e.target.value, false)} placeholder="Pincode (Auto-fills City/State)" maxLength={6} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" />
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GSTIN Optional" />
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remark (optional)"
              className="proforma-full"
            />

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
                  onChange={(e) => handlePincodeLookup(e.target.value, true)}
                  placeholder="Pincode (Auto-fills)"
                  maxLength={6}
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

              <div className="proforma-list" style={{ overflow: "visible", maxHeight: "none" }}>
                <div className="proforma-list-header">
                  <div>Add</div>
                  <div>Journal Identity</div>
                  <div>Subscription Options</div>
                  <div style={{ textAlign: "right" }}>Investment ({currency})</div>
                </div>
                {filtered.map((j) => {
                  const configs = getConfigsForJournal(j.serialNo, j.frequency);
                  const totalIssues = getIssueCountFromFrequency(j.frequency);
                  const issueLabels = getIssueLabels(totalIssues);
                  const isChecked = !!selected[j.serialNo];
                  
                  return (
                    <div className="proforma-row-custom" key={j.serialNo}>
                      <div className="checkbox-container">
                        <div 
                          className={`checkbox-custom ${isChecked ? "checked" : ""}`}
                          onClick={() => setSelected((prev) => ({ ...prev, [j.serialNo]: !prev[j.serialNo] }))}
                        >
                          {isChecked && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <div className="proforma-row-title">
                        <strong>{j.journalName}</strong>
                        <div>
                          <span className="proforma-tag">{j.subject}</span>
                          <span>ISSN: {j.issn || "-"}</span>
                          <span>{j.frequency || "2 Issues"}</span>
                        </div>
                      </div>

                      <div className="proforma-configs-container">
                        {configs.map((config) => {
                          const isAnnual = config.type === "ANNUAL";
                          return (
                            <div className="proforma-config-card" key={config.id}>
                              {configs.length > 1 && (
                                <button 
                                  type="button" 
                                  className="proforma-config-delete-btn" 
                                  onClick={() => removeConfigForJournal(j.serialNo, config.id, j.frequency)}
                                >
                                  ✕
                                </button>
                              )}
                              
                              <div className="proforma-config-card-header">
                                <select 
                                  value={config.type} 
                                  onChange={(e) => updateConfigForJournal(j.serialNo, config.id, { type: e.target.value as "ANNUAL" | "ISSUE_WISE" }, j.frequency)}
                                >
                                  <option value="ANNUAL">Annual</option>
                                  <option value="ISSUE_WISE">Issue Wise</option>
                                </select>
                                
                                <select 
                                  value={config.year} 
                                  onChange={(e) => updateConfigForJournal(j.serialNo, config.id, { year: parseInt(e.target.value, 10) }, j.frequency)}
                                >
                                  <option value="2024">2024</option>
                                  <option value="2025">2025</option>
                                  <option value="2026">2026</option>
                                  <option value="2027">2027</option>
                                </select>
                                
                                <select 
                                  value={config.plan} 
                                  onChange={(e) => updateConfigForJournal(j.serialNo, config.id, { plan: e.target.value as Plan }, j.frequency)}
                                >
                                  <option value="PRINT">Print Only</option>
                                  <option value="ONLINE">Digital Only</option>
                                  <option value="PRINT_ONLINE">Print + Digital</option>
                                </select>
                              </div>

                              {!isAnnual && (
                                <div className="proforma-config-issues-section">
                                  <span className="proforma-config-issues-title">Select Issues:</span>
                                  <div className="proforma-config-issues-list">
                                    {Array.from({ length: totalIssues }, (_, issueIdx) => {
                                      const issueNum = issueIdx + 1;
                                      const isSelected = config.selectedIssues.includes(issueNum);
                                      const label = issueLabels[issueIdx] || `Issue ${issueNum}`;
                                      
                                      return (
                                        <div 
                                          key={issueNum}
                                          className={`proforma-issue-pill ${isSelected ? "selected" : ""}`}
                                          onClick={() => {
                                            const newSelected = isSelected 
                                              ? config.selectedIssues.filter(n => n !== issueNum)
                                              : [...config.selectedIssues, issueNum];
                                            updateConfigForJournal(j.serialNo, config.id, { selectedIssues: newSelected }, j.frequency);
                                          }}
                                        >
                                          {label}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <button 
                          type="button" 
                          className="proforma-add-config-btn"
                          onClick={() => addConfigForJournal(j.serialNo, j.frequency)}
                        >
                          + Add Another Year / Config
                        </button>
                      </div>

                      <div className="proforma-row-price" style={{ fontSize: "16px", color: "#1b2f69", fontWeight: "700" }}>
                        {fmt(
                          configs.reduce((sum, config) => {
                            const annualPrice = getPrice(j, config.plan);
                            const selectedCount = config.type === "ANNUAL" ? totalIssues : config.selectedIssues.length;
                            return sum + (annualPrice / totalIssues) * selectedCount;
                          }, 0)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="proforma-bottom-bar">
                <div>Final Total inclusive of GST <strong>{fmt(grandTotal)}</strong></div>
                <button type="button" className="proforma-cta" onClick={onSubmitQuote} disabled={submitting || selectedRows.length === 0}>
                  {submitting ? "Building..." : "Build Proforma ⚡"}
                </button>
              </div>
            </div>

            <aside className="proforma-summary">
              <h3>Quote Summary</h3>
              <p><span>Subtotal</span><strong>{fmt(subtotal)}</strong></p>
              <p><span>Discount</span><strong>{fmt(discount)}</strong></p>
              <p><span>GST</span><strong>{fmt(gst)}</strong></p>
              <p className="grand"><span>{fmt(grandTotal)}</span></p>
              <p className="selected-count">{selectedRows.length} Selected</p>
              <button className="proforma-review-btn" onClick={onSubmitQuote} disabled={submitting || selectedRows.length === 0}>
                Review Quotation →
              </button>
              {error ? <p className="auth-error">{error}</p> : null}
            </aside>
          </div>
        </section>
      ) : null}

      {step === 3 ? (() => {
        const today = new Date();
        const validDate = new Date();
        validDate.setDate(today.getDate() + 30);
        const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        
        const activeCgst = gst / 2;
        const activeSgst = gst / 2;

        const isJournalsPub = selectedRows.length > 0
          ? selectedRows.some(row => isJournalsPubPublisher(row.publisher))
          : subscriptionType === "PUB";

        const brand = isJournalsPub ? {
          logoText: "JP",
          title: "Journals Pub",
          subtitle: "Dhruv Infosystems Private Limited,",
          address: "A-118, Level 1, Sector 63, Noida - 201301, INDIA.",
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
          email: "subscriptions@journalspub.com",
          phone: "+91-120-4781206",
          regdOffice: "Office No. 4, First Floor, CSC Pocket - E, Mayur Vihar, Phase-II, New Delhi-110091",
          tel: "91 (0)120 - 4781206",
          mob: "+91-9810078958",
          website: "www.journalspub.com"
        } : {
          logoText: "STM",
          title: "STM Journals",
          subtitle: "Consortium e-Learning Network Pvt. Ltd.,",
          address: "A-118 1st Floor, Sector 63, Noida, Uttar Pradesh, India - 201301",
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
          email: "subscriptions@stmjournals.com",
          phone: "+91-120-4781200",
          regdOffice: "Office No. 4, First Floor, CSC Pocket -E, Mayur Vihar, Phase-II, New Delhi-110091",
          tel: "01120 - 4781206",
          mob: "+91-9810078958",
          website: "shop.stmjournals.com"
        };

        return (
          <section className="proforma-preview-wrap" style={{ background: "#f1f5f9", padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <article id="invoice-capture-area" className="proforma-invoice" style={{
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
              
              {/* Border Outer Wrapper to match PDF strictly */}
              <div style={{ border: "1px solid #94a3b8", padding: "1px" }}>
                
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #94a3b8", padding: "15px 20px" }}>
                  <div style={{ width: "15%", display: "flex", justifyContent: "center" }}>
                    {isJournalsPub ? (
                      <img src="/journalspub-logo.png" alt="Journals Pub" style={{ maxHeight: "65px", objectFit: "contain" }} />
                    ) : (
                      <img src="/stmlogo.png" alt="STM" style={{ maxHeight: "65px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).src = "https://dummyimage.com/100x100/1e3a8a/ffffff.png&text=STM"; }} />
                    )}
                  </div>
                  <div style={{ width: "85%", textAlign: "center", paddingRight: "10%" }}>
                    <h1 style={{ fontSize: "34px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "0.5px" }}>{brand.title}</h1>
                    <p style={{ fontSize: "12px", fontWeight: "600", margin: "0", color: "#334155" }}>{brand.subtitle}</p>
                    <p style={{ fontSize: "11px", fontWeight: "700", margin: "4px 0 0 0", color: "#1e293b", letterSpacing: "0.04em" }}>PROFORMA INVOICE</p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{brand.address}</p>
                  </div>
                </div>

                {/* Metadata Three Panels Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #94a3b8" }}>
                  {/* Col 1 */}
                  <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" }}>PROFORMA INVOICE NUMBER :</span>
                    <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>{quoteId || "PRO-2026-DRAFT"}</div>
                    
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" }}>PROFORMA INVOICE DATE :</span>
                    <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: "4px 0 10px 0" }}>{formatDate(today)}</div>
                    
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569" }}>VALID UNTIL :</span>
                    <div style={{ fontSize: "17px", fontWeight: "800", color: "#2563eb", margin: "4px 0 0 0" }}>{formatDate(validDate)}</div>
                  </div>
                  {/* Col 2 */}
                  <div style={{ padding: "12px 15px", borderRight: "1px solid #94a3b8", fontSize: "11px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em", color: "#475569", display: "block", marginBottom: "6px" }}>BANK DETAILS:</span>
                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "4px 2px" }}>
                      <strong style={{ color: "#475569" }}>Bank Name :</strong> <span>{brand.bankName}</span>
                      <strong style={{ color: "#475569" }}>Bank Address :</strong> <span>{brand.bankAddress}</span>
                      <strong style={{ color: "#475569" }}>A/C. Number :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{brand.accountNumber}</span>
                      <strong style={{ color: "#475569" }}>IFSC Code :</strong> <span>{brand.ifscCode}</span>
                      <strong style={{ color: "#475569" }}>Swift Code :</strong> <span>{brand.swiftCode}</span>
                      <strong style={{ color: "#475569" }}>A/C. Holder :</strong> <span style={{ fontWeight: "600" }}>{brand.accountHolder}</span>
                    </div>
                  </div>
                  {/* Col 3 */}
                  <div style={{ padding: "12px 15px", fontSize: "11px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "8px 2px" }}>
                      <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>GSTIN :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{brand.gstin}</span>
                      <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>PAN No. :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{brand.pan}</span>
                      <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>CIN No. :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{brand.cin}</span>
                      <strong style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase" }}>Legal Name :</strong> <span>{brand.legalName}</span>
                    </div>
                  </div>
                </div>

                {/* Billed and Shipped Section */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #94a3b8", minHeight: "150px" }}>
                  {/* Billed Column */}
                  <div style={{ padding: "15px", borderRight: "1px solid #94a3b8" }}>
                    <h4 style={{ fontSize: "10px", fontWeight: "750", textTransform: "uppercase", borderBottom: "1.5px solid #334155", paddingBottom: "4px", margin: "0 0 12px 0", display: "inline-block", color: "#1e293b" }}>
                      BILL TO / DETAILS OF RECEIVER:
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", gap: "6px 4px", fontSize: "11.5px" }}>
                      <strong style={{ color: "#64748b" }}>Name :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{contactName}</span>
                      <strong style={{ color: "#64748b" }}>Institution :</strong> <span style={{ fontWeight: "600" }}>{institutionName || organization || "N/A"}</span>
                      <strong style={{ color: "#64748b" }}>Address :</strong> <span>{address}{city ? `, ${city}` : ""}{stateName ? `, ${stateName}` : ""}{pincode ? ` - ${pincode}` : ""}. <br/>Phone:- {phone} Email:- {email}</span>
                      <strong style={{ color: "#64748b" }}>GSTIN :</strong> <span style={{ fontWeight: "700" }}>{gstNumber || "N/A"}</span>
                    </div>
                  </div>

                  {/* Shipped Column */}
                  <div style={{ padding: "15px", position: "relative" }}>
                    {/* QR Box Overlay */}
                    <div style={{ position: "absolute", right: "15px", top: "15px", border: "1px solid #cbd5e1", padding: "4px", textAlign: "center", width: "60px" }}>
                      <span style={{ fontSize: "7px", fontWeight: "700", display: "block", marginBottom: "2px" }}>SCAN INVOICE</span>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/invoice.aspx?I=${quoteId || "PRO-2026"}`)}`}
                        alt="Invoice QR Code"
                        style={{ width: "35px", height: "35px", border: "1px dashed #cbd5e1", background: "#fff" }}
                      />
                    </div>

                    <h4 style={{ fontSize: "10px", fontWeight: "750", textTransform: "uppercase", borderBottom: "1.5px solid #334155", paddingBottom: "4px", margin: "0 0 12px 0", display: "inline-block", color: "#1e293b" }}>
                      SHIP TO / DELIVERY ADDRESS:
                    </h4>

                    <div style={{ display: "grid", gridTemplateColumns: "85px 1fr", gap: "6px 4px", fontSize: "11.5px", paddingRight: "70px" }}>
                      <strong style={{ color: "#64748b" }}>Recipient :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{sameAsBilling ? contactName : shippingRecipientName || contactName}</span>
                      <strong style={{ color: "#64748b" }}>Address :</strong> <span>
                        {sameAsBilling 
                          ? `${address}${city ? `, ${city}` : ""}${stateName ? `, ${stateName}` : ""}${pincode ? ` - ${pincode}` : ""}` 
                          : `${shippingAddress}${shippingCity ? `, ${shippingCity}` : ""}${shippingState ? `, ${shippingState}` : ""}${shippingPincode ? ` - ${shippingPincode}` : ""}`
                        }
                      </span>
                      <strong style={{ color: "#64748b" }}>Contact :</strong> <span>{sameAsBilling ? phone : shippingPhone || phone}</span>
                      <strong style={{ color: "#64748b" }}>IEC No. :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>AACCC6494M</span>
                    </div>

                    <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "12px", paddingTop: "8px", fontSize: "11.5px" }}>
                      <span style={{ fontSize: "9px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>ORDER INFORMATION:</span>
                      <div style={{ marginTop: "4px" }}><strong style={{ color: "#64748b" }}>Contact Person :</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{contactName || "N/A"}</span></div>
                      <div><strong style={{ color: "#64748b" }}>Order Placed By :</strong> <span style={{ fontWeight: "750", color: "#0f172a", textTransform: "uppercase" }}>{sameAsBilling ? (institutionName || organization || contactName) : (shippingInstitute || institutionName || organization || contactName)}</span></div>
                    </div>
                  </div>
                </div>

                {/* The Itemized Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #94a3b8" }} cellPadding="6">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontSize: "10.5px", fontWeight: "800" }}>
                      <th style={{ width: "5%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>Sr.No</th>
                      <th style={{ width: "35%", borderRight: "1px solid #94a3b8", textAlign: "left" }}>Particulars</th>
                      <th style={{ width: "10%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>HSN/SAC</th>
                      <th style={{ width: "6%", borderRight: "1px solid #94a3b8", textAlign: "center" }}>Qty</th>
                      <th style={{ width: "11%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Unit Price</th>
                      <th style={{ width: "11%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Amount</th>
                      <th style={{ width: "10%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Discount</th>
                      <th style={{ width: "12%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>Taxable Value</th>
                      <th style={{ width: "10%", borderRight: "1px solid #94a3b8", textAlign: "right" }}>GST Rate (%)</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedItemizedTotals.map((it, idx) => {
                      const planLabel = it.plan === "PRINT_ONLINE" ? "Print + Digital Subscription" : it.plan === "ONLINE" ? "Online Subscription" : "Print Subscription";
                      return (
                        <tr key={`${it.row.serialNo}-${idx}`} style={{ borderBottom: "1px solid #e2e8f0", fontSize: "11.5px" }}>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center", color: "#475569" }}>{idx + 1}</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "left", fontWeight: "600", color: "#1e293b", lineHeight: "1.3", padding: "8px 6px" }}>
                            {it.row.journalName}
                            <div style={{ fontSize: "9px", fontWeight: "400", color: "#64748b", marginTop: "2px" }}>
                              {it.rangeLabel} | {planLabel}
                            </div>
                          </td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center" }}>{it.hsn}</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "center" }}>1</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{Number(it.unitPrice).toFixed(2)}</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{Number(it.unitPrice).toFixed(2)}</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{Number(it.itemDiscount).toFixed(2)}</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right", fontWeight: "600" }}>{Number(it.itemTaxable).toFixed(2)}</td>
                          <td style={{ borderRight: "1px solid #94a3b8", textAlign: "right" }}>{Number(it.gstRate).toFixed(2)}</td>
                          <td style={{ textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{Number(it.netAmount).toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    {/* Financial Ledger Summary Overlay Row */}
                    <tr>
                      <td colSpan={6} style={{ borderRight: "1px solid #94a3b8", borderTop: "1px solid #94a3b8", verticalAlign: "top", padding: "12px" }}>
                        <div style={{ fontSize: "11px", color: "#334155" }}>
                          <strong style={{ color: "#0f172a" }}>In Words:</strong> {amountInWords(grandTotal)}
                        </div>
                      </td>
                      <td colSpan={4} style={{ borderTop: "1px solid #94a3b8", padding: "0" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "4px", padding: "10px", fontSize: "11.5px" }}>
                          <span style={{ textAlign: "right", color: "#64748b" }}>Subtotal:</span>
                          <span style={{ textAlign: "right", fontWeight: "600" }}>{Number(subtotal).toFixed(2)}</span>
                          
                          {discount > 0 && (
                            <>
                              <span style={{ textAlign: "right", color: "#64748b" }}>Discount:</span>
                              <span style={{ textAlign: "right", color: "#ef4444" }}>-{Number(discount).toFixed(2)}</span>
                            </>
                          )}

                          {currency === "INR" && (
                            <>
                              <span style={{ textAlign: "right", color: "#64748b" }}>CGST (9%):</span>
                              <span style={{ textAlign: "right" }}>{Number(activeCgst).toFixed(2)}</span>
                              
                              <span style={{ textAlign: "right", color: "#64748b" }}>SGST (9%):</span>
                              <span style={{ textAlign: "right" }}>{Number(activeSgst).toFixed(2)}</span>
                            </>
                          )}

                          <span style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px", fontSize: "13px" }}>Total ({currency}):</span>
                          <span style={{ textAlign: "right", fontWeight: "800", color: "#0f172a", borderTop: "1.5px solid #334155", paddingTop: "6px", marginTop: "4px", fontSize: "13px" }}>{Number(grandTotal).toFixed(2)}</span>

                          <span style={{ textAlign: "right", fontSize: "9px", color: "#94a3b8" }}>Round Off :</span>
                          <span style={{ textAlign: "right", fontSize: "9px", color: "#94a3b8" }}>- 0</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Note Bar */}
                <div style={{ padding: "12px 15px", borderBottom: "1px solid #94a3b8", background: "#f8fafc", fontStyle: "italic", color: "#334155", fontSize: "11px" }}>
                  The sum of {currency} {Math.round(grandTotal)}/- is a payment on account of subscription by NEFT/RTGS.
                </div>
                {remarks.trim() ? (
                  <div style={{ padding: "10px 15px", borderBottom: "1px solid #94a3b8", fontSize: "11px", color: "#334155" }}>
                    <strong style={{ color: "#1e293b" }}>Remark:</strong> {remarks}
                  </div>
                ) : null}

                {/* Terms & Signature Block */}
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", textAlign: "center" }}>
                    <strong style={{ color: "#0f172a", fontSize: "11px", marginBottom: "8px" }}>For, {brand.title.toUpperCase()}</strong>
                    <img
                      src="/authorized-signature.png"
                      alt="Authorised Signature"
                      style={{ width: "130px", height: "auto", objectFit: "contain", marginBottom: "6px" }}
                    />
                    <div style={{ width: "180px", borderBottom: "1px solid #64748b" }}></div>
                    <span style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", marginTop: "5px", letterSpacing: "0.05em", color: "#334155" }}>AUTHORISED SIGNATORY</span>
                  </div>
                </div>

              </div> {/* End Outer Border Box */}

              {/* Corporate Footers Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px", fontSize: "10px", borderTop: "1px solid #cbd5e1", paddingTop: "10px" }}>
                <div>
                  <strong style={{ color: "#64748b", textTransform: "uppercase" }}>REGD. OFFICE:</strong>
                  <p style={{ margin: "2px 0", color: "#475569" }}>{brand.regdOffice}</p>
                </div>
                <div>
                  <strong style={{ color: "#64748b", textTransform: "uppercase" }}>SALES & ADMIN OFFICE:</strong>
                  <p style={{ margin: "2px 0", color: "#475569" }}>{brand.title}, {brand.subtitle}, {brand.address}</p>
                </div>
              </div>

              <div style={{ textAlign: "center", borderTop: "1px dashed #cbd5e1", marginTop: "12px", paddingTop: "8px", fontSize: "10px", color: "#64748b" }}>
                Tel: {brand.tel} &nbsp;|&nbsp; Mob: {brand.mob} &nbsp;|&nbsp; E-mail: {brand.email} &nbsp;|&nbsp; Website: {brand.website}
                <div style={{ fontSize: "8px", marginTop: "6px", color: "#94a3b8" }}>
                  This computer generated invoice is available online at: {window.location.origin}/invoice.aspx?I={quoteId || "PRO-2026"}
                </div>
              </div>

            </article>

            <div className="proforma-preview-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
              <button className="catalogues-ghost" onClick={() => setStep(2)}>← Back to Selection</button>
              <button className="catalogues-primary" style={{ background: "#2563eb" }} onClick={onDownloadInvoicePdf}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                PRINT / SAVE AS PDF
              </button>
              <button 
                className="catalogues-ghost" 
                onClick={onSendEmailNotification} 
                disabled={sendingEmail || !quoteId || quoteId.startsWith("draft-")}
              >
                {sendingEmail ? "✉ Dispatching..." : "✉ Send Email"}
              </button>
              <button
                className="catalogues-primary"
                style={{ background: "#10b981" }}
                onClick={() =>
                  router.push(
                    `/checkout?quoteId=${encodeURIComponent(quoteId || "DRAFT")}&total=${encodeURIComponent(String(grandTotal))}&name=${encodeURIComponent(contactName)}&email=${encodeURIComponent(email)}&organization=${encodeURIComponent(institutionName || organization)}&address=${encodeURIComponent(address)}&state=${encodeURIComponent(stateName)}&pincode=${encodeURIComponent(pincode)}&gst=${encodeURIComponent(gstNumber)}&subject=${encodeURIComponent(selectedRows[0]?.subject || "Subscription")}`
                  )
                }
              >
                ⚡ Pay Now
              </button>
            </div>
            {emailSuccessMsg ? <p className="auth-success" style={{ textAlign: "center", color: "green", marginTop: "10px" }}>{emailSuccessMsg}</p> : null}
            {error ? <p className="auth-error" style={{ textAlign: "center", color: "red", marginTop: "10px" }}>{error}</p> : null}
          </section>
        );
      })() : null}
    </main>
  );
}
