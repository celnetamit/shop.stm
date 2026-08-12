// Seeds the Independence Day 2026 promo coupon: FREEDOM15 — 15% off the
// overall order, valid until end of day 15 August 2026 (IST).
//
// Run with:  node scripts/seed-freedom15-coupon.js
// Safe to re-run: it upserts on the unique `code`.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// IST is UTC+5:30, so an IST wall-clock instant is that time minus 5h30m in UTC.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const istInstant = (isoWithoutZone) => new Date(Date.parse(`${isoWithoutZone}Z`) - IST_OFFSET_MS);

const COUPON = {
  code: "FREEDOM15",
  type: "PERCENTAGE",
  value: 15,
  discount: 15, // legacy integer field still read by the cart/drawer
  maxUses: null, // unlimited
  minOrderAmount: 0,
  validFrom: istInstant("2026-08-01T00:00:00"),
  validUntil: istInstant("2026-08-15T23:59:59"),
  isActive: true
};

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: COUPON.code },
    create: COUPON,
    update: {
      type: COUPON.type,
      value: COUPON.value,
      discount: COUPON.discount,
      maxUses: COUPON.maxUses,
      minOrderAmount: COUPON.minOrderAmount,
      validFrom: COUPON.validFrom,
      validUntil: COUPON.validUntil,
      isActive: COUPON.isActive
    }
  });

  console.log("✅ Coupon ready:", {
    code: coupon.code,
    discount: `${coupon.value}%`,
    validFrom: coupon.validFrom?.toISOString(),
    validUntil: coupon.validUntil?.toISOString(),
    isActive: coupon.isActive,
    usedCount: coupon.usedCount
  });
}

main()
  .catch((err) => {
    console.error("❌ Failed to seed FREEDOM15 coupon:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
