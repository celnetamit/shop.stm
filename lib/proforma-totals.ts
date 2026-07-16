// Single source of truth for proforma / order money math.
// Every path (checkout API, proforma email PDF, account print page, email body,
// checkout client) MUST derive totals from here so the same PI number never
// shows two different totals. GST is charged per-item, only on digital plans,
// only in INR, and only when the buyer is not GST-exempt.

export type PlanCode = "PRINT" | "ONLINE" | "PRINT_ONLINE";
export type CurrencyCode = "INR" | "USD";
export type UserRoleLike =
  | "USER"
  | "ADMIN"
  | "MANAGER"
  | "LIBRARIAN"
  | "AGENCY"
  | "STUDENT"
  | "SCHOLAR"
  | null
  | undefined;

export interface TotalsLineItem {
  unitPrice: number;
  qty?: number;
  selectedPlan: PlanCode;
}

export interface TotalsOptions {
  currency: CurrencyCode;
  /** Whole-number percent (0-100). */
  discountPercent: number;
  role?: UserRoleLike;
  subscriberCategory?: string | null;
}

export interface ComputedTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  total: number;
  gstExempt: boolean;
}

export function isBookProduct(
  journalName: string | null | undefined,
  subject: string | null | undefined
): boolean {
  const lowerName = (journalName ?? "").toLowerCase();
  const lowerSubject = (subject ?? "").toLowerCase();
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

export function getHsnCode(
  journalName: string | null | undefined,
  subject: string | null | undefined,
  plan: PlanCode
): string {
  if (plan === "ONLINE") return "998431";
  return isBookProduct(journalName, subject) ? "4901" : "4902";
}

/**
 * Determines GST exemption. A stated user role wins over the quote's
 * subscriber category. LIBRARIAN/USER (colleges & institutions) are exempt;
 * AGENCY/STUDENT/SCHOLAR are not. When no role is known, fall back to the
 * quote's subscriber category (COLLEGE / EXISTING_PI are exempt).
 */
export function resolveGstExempt(opts: {
  role?: UserRoleLike;
  subscriberCategory?: string | null;
}): boolean {
  const { role, subscriberCategory } = opts;
  if (role) {
    if (role === "LIBRARIAN" || role === "USER") return true;
    return false; // AGENCY / STUDENT / SCHOLAR / ADMIN / MANAGER
  }
  return subscriberCategory === "COLLEGE" || subscriberCategory === "EXISTING_PI";
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeTotals(items: TotalsLineItem[], opts: TotalsOptions): ComputedTotals {
  const gstExempt = resolveGstExempt(opts);
  const isINR = opts.currency === "INR";
  const pct = Math.max(0, Math.min(100, Number(opts.discountPercent) || 0));

  let subtotal = 0;
  let discount = 0;
  let taxable = 0;
  let cgst = 0;
  let sgst = 0;

  for (const it of items) {
    const qty = Math.max(1, Math.round(Number(it.qty) || 1));
    const line = Math.max(0, Number(it.unitPrice) || 0) * qty;
    const itemDiscount = (line * pct) / 100;
    const itemTaxable = line - itemDiscount;

    const isDigital = it.selectedPlan === "ONLINE" || it.selectedPlan === "PRINT_ONLINE";
    const itemGst = isINR && isDigital && !gstExempt ? itemTaxable * 0.18 : 0;

    subtotal += line;
    discount += itemDiscount;
    taxable += itemTaxable;
    cgst += itemGst / 2;
    sgst += itemGst / 2;
  }

  const rSubtotal = round2(subtotal);
  const rDiscount = round2(discount);
  const rTaxable = round2(taxable);
  const rCgst = round2(cgst);
  const rSgst = round2(sgst);

  return {
    subtotal: rSubtotal,
    discount: rDiscount,
    taxable: rTaxable,
    cgst: rCgst,
    sgst: rSgst,
    total: round2(rTaxable + rCgst + rSgst),
    gstExempt
  };
}
