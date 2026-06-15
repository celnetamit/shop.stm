import { describe, it, expect } from "vitest";
import { formatPiNumber, resolvePiNumber } from "@/lib/pi-number";

describe("formatPiNumber", () => {
  it("passes through draft / empty ids", () => {
    expect(formatPiNumber({ id: "draft-123" })).toBe("draft-123");
    expect(formatPiNumber({ id: "" })).toBe("DRAFT");
  });

  it("is deterministic and shaped XXXX/dd-mm-yy/XXX", () => {
    const a = formatPiNumber({ id: "abc", createdAt: "2026-06-15T00:00:00.000Z" });
    const b = formatPiNumber({ id: "abc", createdAt: "2026-06-15T00:00:00.000Z" });
    expect(a).toBe(b);
    expect(a).toMatch(/^\d{4}\/\d{2}-\d{2}-\d{2}\/\d{3}$/);
  });
});

describe("resolvePiNumber", () => {
  it("prefers the stored piNumber when present", () => {
    expect(
      resolvePiNumber({ id: "abc", createdAt: "2026-06-15T00:00:00.000Z", piNumber: "PRO-2026-5001" })
    ).toBe("PRO-2026-5001");
  });

  it("falls back to the derived format when piNumber is null/absent", () => {
    const derived = formatPiNumber({ id: "abc", createdAt: "2026-06-15T00:00:00.000Z" });
    expect(resolvePiNumber({ id: "abc", createdAt: "2026-06-15T00:00:00.000Z", piNumber: null })).toBe(derived);
    expect(resolvePiNumber({ id: "abc", createdAt: "2026-06-15T00:00:00.000Z" })).toBe(derived);
  });
});
