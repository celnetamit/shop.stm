import { describe, it, expect } from "vitest";
import { makeCatalogPriceLookup } from "@/lib/journal-catalog";

const catalog = [
  { issn: "1234-5678", journalName: "International Journal of Testing", printInr: 1500, onlineInr: "2,000", combinedInr: 2500 },
  { issn: null, journalName: "Journal of No ISSN", printInr: 800, onlineInr: 900, combinedInr: 1000 }
];

describe("makeCatalogPriceLookup (Phase 3b authoritative cart pricing)", () => {
  const lookup = makeCatalogPriceLookup(catalog);

  it("matches by ISSN and returns the plan price (ISSN normalized, string price coerced)", () => {
    expect(lookup({ issn: "1234-5678", plan: "PRINT" })).toBe(1500);
    expect(lookup({ issn: "12345678", plan: "ONLINE" })).toBe(2000); // normalized ISSN + "2,000" -> 2000
    expect(lookup({ issn: "1234-5678", plan: "PRINT_ONLINE" })).toBe(2500);
  });

  it("falls back to name match, stripping the cart's '(issue)' suffix, when ISSN is missing", () => {
    expect(lookup({ journalName: "Journal of No ISSN (All(Jan-Dec))", plan: "PRINT" })).toBe(800);
  });

  it("returns null when the journal can't be matched (caller then skips validation)", () => {
    expect(lookup({ issn: "0000-0000", journalName: "Nonexistent", plan: "ONLINE" })).toBeNull();
  });
});
