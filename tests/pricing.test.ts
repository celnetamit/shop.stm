import { describe, it, expect } from "vitest";
import { computeTotals, computeCouponDiscountAmount, computeSubtotal, isUnderpaid, quoteTotals } from "@/lib/pricing";

type Plan = "PRINT" | "ONLINE" | "PRINT_ONLINE";
const item = (unitPrice: number, plan: Plan, qty = 1) => ({ unitPrice, qty, plan });

describe("computeSubtotal", () => {
  it("sums price*qty with flooring guards", () => {
    expect(computeSubtotal([item(1000, "PRINT", 2), item(500, "ONLINE")])).toBe(2500);
    // qty floored to >=1, price floored to >=0
    expect(computeSubtotal([{ unitPrice: 0, qty: 0, plan: "PRINT" }])).toBe(0);
  });
});

describe("computeTotals (GST rule: 18% only for digital plans, INR, non-exempt)", () => {
  it("PRINT in INR -> no GST", () => {
    const t = computeTotals({ items: [item(1000, "PRINT")], isINR: true, isExempt: false, discountAmount: 0 });
    expect(t).toMatchObject({ subtotal: 1000, discount: 0, cgst: 0, sgst: 0, total: 1000 });
  });

  it("ONLINE in INR, non-exempt -> 18% split 9/9", () => {
    const t = computeTotals({ items: [item(1000, "ONLINE")], isINR: true, isExempt: false, discountAmount: 0 });
    expect(t.cgst).toBe(90);
    expect(t.sgst).toBe(90);
    expect(t.total).toBe(1180);
  });

  it("ONLINE but exempt subscriber -> no GST", () => {
    const t = computeTotals({ items: [item(1000, "ONLINE")], isINR: true, isExempt: true, discountAmount: 0 });
    expect(t.total).toBe(1000);
  });

  it("ONLINE in USD -> no GST", () => {
    const t = computeTotals({ items: [item(1000, "ONLINE")], isINR: false, isExempt: false, discountAmount: 0 });
    expect(t.total).toBe(1000);
  });

  it("applies discount before GST and clamps discount to subtotal", () => {
    const t = computeTotals({ items: [item(1000, "ONLINE")], isINR: true, isExempt: false, discountAmount: 100 });
    expect(t.discount).toBe(100);
    expect(t.cgst).toBe(81); // 18% of 900 taxable, split
    expect(t.total).toBe(1062);

    const over = computeTotals({ items: [item(1000, "ONLINE")], isINR: true, isExempt: false, discountAmount: 99999 });
    expect(over.discount).toBe(1000);
    expect(over.total).toBe(0);
  });

  it("keeps fractional (percentage) discounts to 2 decimals", () => {
    // subtotal 1505, 10% -> 150.5 discount; taxable 1354.5; CGST/SGST 121.91 each; total 1598.32
    const t = computeTotals({ items: [item(1505, "ONLINE")], isINR: true, isExempt: false, discountAmount: 1505 * 0.1 });
    expect(t.discount).toBe(150.5);
    expect(t.taxable).toBe(1354.5);
    expect(t.cgst).toBe(121.91);
    expect(t.total).toBe(1598.32);
  });
});

describe("computeCouponDiscountAmount", () => {
  it("PERCENTAGE (clamped to 100%)", () => {
    expect(computeCouponDiscountAmount("PERCENTAGE", 10, 1000)).toBe(100);
    expect(computeCouponDiscountAmount("PERCENTAGE", 150, 1000)).toBe(1000);
    expect(computeCouponDiscountAmount("PERCENTAGE", -5, 1000)).toBe(0);
  });

  it("FIXED (clamped to subtotal)", () => {
    expect(computeCouponDiscountAmount("FIXED", 250, 1000)).toBe(250);
    expect(computeCouponDiscountAmount("FIXED", 5000, 1000)).toBe(1000);
  });
});

describe("quoteTotals (server-authoritative quote pricing)", () => {
  it("derives totals from quote items + locked couponPercent; GST only on digital lines", () => {
    const t = quoteTotals({
      items: [
        { unitPrice: 1000, selectedPlan: "ONLINE" },
        { unitPrice: 500, selectedPlan: "PRINT" }
      ],
      currency: "INR",
      subscriberCategory: "INDIVIDUAL",
      couponPercent: 10
    });
    expect(t.subtotal).toBe(1500);
    expect(t.discount).toBe(150);
    expect(t.cgst).toBe(81); // 18% of the discounted ONLINE line (900), split
    expect(t.total).toBe(1512);
  });

  it("exempt subscriber (COLLEGE) -> no GST", () => {
    const t = quoteTotals({
      items: [{ unitPrice: 1000, selectedPlan: "ONLINE" }],
      currency: "INR",
      subscriberCategory: "COLLEGE",
      couponPercent: 0
    });
    expect(t.total).toBe(1000);
  });
});

describe("isUnderpaid (security: payment reconciliation)", () => {
  it("allows a 100 sub-unit rounding tolerance, rejects clear underpayment", () => {
    expect(isUnderpaid(118000, 118000)).toBe(false);
    expect(isUnderpaid(117901, 118000)).toBe(false); // within tolerance
    expect(isUnderpaid(100, 118000)).toBe(true); // ₹1 paid for an ₹1180 order
  });
});
