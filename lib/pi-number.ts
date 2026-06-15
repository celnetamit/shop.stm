type PiSource = {
  id: string;
  createdAt?: string | Date | null;
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pad(num: number, size: number): string {
  return String(num).padStart(size, "0");
}

function toDateParts(createdAt?: string | Date | null): { dd: string; mm: string; yy: string; iso: string } {
  const date = createdAt ? new Date(createdAt) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const dd = pad(safeDate.getUTCDate(), 2);
  const mm = pad(safeDate.getUTCMonth() + 1, 2);
  const yy = pad(safeDate.getUTCFullYear() % 100, 2);
  const iso = safeDate.toISOString();
  return { dd, mm, yy, iso };
}

export function formatPiNumber({ id, createdAt }: PiSource): string {
  if (!id || id.startsWith("draft-")) return id || "DRAFT";

  const { dd, mm, yy, iso } = toDateParts(createdAt);
  const head = 1000 + (hashString(id) % 9000);
  const tail = 100 + (hashString(`${id}|${iso}`) % 900);

  return `${head}/${dd}-${mm}-${yy}/${tail}`;
}

/**
 * Canonical PI number for a quote. Prefers the stored, unique `piNumber` (N1);
 * falls back to the legacy derived format for rows created before the column
 * existed, so existing quotes/PDFs/emails keep their numbers. Client-safe (pure).
 */
export function resolvePiNumber(quote: { id: string; createdAt?: string | Date | null; piNumber?: string | null }): string {
  if (quote.piNumber) return quote.piNumber;
  return formatPiNumber({ id: quote.id, createdAt: quote.createdAt });
}
