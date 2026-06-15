import { prisma } from "@/lib/prisma";

// Server-only. Keep this OUT of lib/pi-number.ts, which is imported by client
// components — importing prisma there would break the browser bundle.

const SEQUENCE_NAME = "proforma_pi_seq";
const SEQUENCE_START = 5000; // human-friendly starting point, clearly past any legacy/manual numbers

/**
 * Allocate the next sequential value from a dedicated Postgres sequence.
 * Sequences are atomic, so this is race-free even under concurrent quote creation.
 * The sequence is created lazily (idempotently) the first time it's needed, which
 * keeps this compatible with `prisma db push` deployments (no migration file needed).
 */
async function nextSequenceValue(): Promise<number> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ nextval: bigint }>>(
      `SELECT nextval('${SEQUENCE_NAME}') AS nextval`
    );
    return Number(rows[0].nextval);
  } catch {
    // Sequence doesn't exist yet — create it (idempotent) and retry once.
    await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ${SEQUENCE_NAME} START ${SEQUENCE_START}`);
    const rows = await prisma.$queryRawUnsafe<Array<{ nextval: bigint }>>(
      `SELECT nextval('${SEQUENCE_NAME}') AS nextval`
    );
    return Number(rows[0].nextval);
  }
}

/**
 * Allocate a unique PI number and store it on the quote. Format: PRO-<year>-<seq>.
 * Best-effort and resilient: if the `piNumber` column or the sequence isn't available
 * yet (e.g. during a rollout before `db push` runs), it logs and returns null so the
 * caller falls back to the legacy derived PI number — no downtime, no failed requests.
 */
export async function assignPiNumber(quoteId: string, createdAt: Date | null): Promise<string | null> {
  try {
    const year = (createdAt ?? new Date()).getUTCFullYear();
    const seq = await nextSequenceValue();
    const piNumber = `PRO-${year}-${seq}`;
    await prisma.proformaQuote.update({ where: { id: quoteId }, data: { piNumber } });
    return piNumber;
  } catch (error) {
    console.error("[pi-allocator] PI number assignment skipped (column/sequence not ready):", error);
    return null;
  }
}
