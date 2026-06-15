// Single source of truth for order/quote money math. Pure & dependency-free so it is
// trivially unit-testable and reusable by the orders route, proforma routes, and the
// checkout/proforma clients (Phase 2 will route all callers through here).
//
// GST rule (mirrors the reviewed checkout/quote behavior): CGST+SGST = 18% applies ONLY
// to digital plans (ONLINE / PRINT_ONLINE), in INR, for non-exempt subscribers.

export type PricingPlan = "PRINT" | "ONLINE" | "PRINT_ONLINE";
export type PricingItem = { unitPrice: number; qty: number; plan: PricingPlan };

export type Totals = {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  total: number;
};

export type CouponType = "PERCENTAGE" | "FIXED";

/** Sub-unit (paise/cents) tolerance allowed when reconciling a captured payment. */
export const PAYMENT_TOLERANCE_PAISE = 100;

export function isDigitalPlan(plan: PricingPlan): boolean {
  return plan === "ONLINE" || plan === "PRINT_ONLINE";
}

/**
 * The single GST rule: 18% applies only to digital plans (ONLINE / PRINT_ONLINE), in INR,
 * for non-exempt subscribers (COLLEGE / EXISTING_PI are exempt). Returns the percentage rate.
 */
export function gstRateFor(plan: PricingPlan, isINR: boolean, isExempt: boolean): number {
  return isINR && isDigitalPlan(plan) && !isExempt ? 18 : 0;
}

function lineSubtotal(items: PricingItem[]): number {
  let subtotal = 0;
  for (const it of items) {
    const qty = Math.max(1, Math.round(it.qty || 1));
    const price = Math.max(0, Math.round(it.unitPrice || 0));
    subtotal += price * qty;
  }
  return subtotal;
}

/** Subtotal-only helper (used to size a coupon before computing the full breakdown). */
export function computeSubtotal(items: PricingItem[]): number {
  return lineSubtotal(items);
}

/**
 * Authoritative order/quote totals. `discountAmount` is an absolute amount already
 * resolved from the coupon; it is clamped to the subtotal. GST is applied per-item on
 * the post-discount line value, only for digital plans in INR for non-exempt subscribers.
 */
export function computeTotals(input: {
  items: PricingItem[];
  isINR: boolean;
  isExempt: boolean;
  discountAmount: number;
}): Totals {
  const { items, isINR, isExempt } = input;
  const subtotal = lineSubtotal(items);
  // 2-decimal rounding: percentage discounts (subtotal*pct/100) can be fractional and
  // are displayed to 2 decimals on quotes/invoices; integer order discounts stay integer.
  const discount = Math.min(subtotal, Math.max(0, Math.round((input.discountAmount || 0) * 100) / 100));
  const taxable = subtotal - discount;
  const discountFraction = subtotal > 0 ? discount / subtotal : 0;

  let gstTotal = 0;
  for (const it of items) {
    const qty = Math.max(1, Math.round(it.qty || 1));
    const price = Math.max(0, Math.round(it.unitPrice || 0));
    const itemTaxable = price * qty * (1 - discountFraction);
    gstTotal += itemTaxable * (gstRateFor(it.plan, isINR, isExempt) / 100);
  }

  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal / 2) * 100) / 100;
  const total = Math.round((taxable + cgst + sgst) * 100) / 100;
  return { subtotal, discount, taxable, cgst, sgst, total };
}

/** Discount amount for a coupon of `type`/`value` against `subtotal`, clamped to subtotal. */
export function computeCouponDiscountAmount(type: CouponType, value: number, subtotal: number): number {
  if (type === "FIXED") {
    return Math.min(Math.max(0, Math.round(value)), subtotal);
  }
  const pct = Math.max(0, Math.min(100, value));
  return Math.min(Math.round((subtotal * pct) / 100), subtotal);
}

/** True when the captured amount is clearly below the expected amount (beyond rounding). */
export function isUnderpaid(paidPaise: number, expectedPaise: number): boolean {
  return paidPaise + PAYMENT_TOLERANCE_PAISE < expectedPaise;
}

/**
 * Authoritative totals for a proforma quote, derived from the quote's OWN stored items
 * and its locked `couponPercent`. Used server-side (razorpay-order, orders) so the amount
 * charged equals the amount displayed equals the amount recorded — and a client cannot
 * tamper with unit prices. The locked percent (not a re-validated coupon) is used because
 * a quote locks its price; that is exactly what the checkout client displays.
 */
export function quoteTotals(quote: {
  items: Array<{ unitPrice: number; selectedPlan: PricingPlan }>;
  currency: string;
  subscriberCategory?: string | null;
  couponPercent?: number | null;
}): Totals {
  const items = quote.items.map((it) => ({ unitPrice: it.unitPrice, qty: 1, plan: it.selectedPlan }));
  const subtotal = computeSubtotal(items);
  const isExempt = quote.subscriberCategory === "COLLEGE" || quote.subscriberCategory === "EXISTING_PI";
  return computeTotals({
    items,
    isINR: quote.currency === "INR",
    isExempt,
    discountAmount: (subtotal * (quote.couponPercent || 0)) / 100
  });
}
