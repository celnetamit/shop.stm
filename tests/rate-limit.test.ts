import { describe, it, expect, vi } from "vitest";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = `t-${Math.random()}`; // unique key so module-level state doesn't leak across tests
    const limit = 3;
    const win = 60_000;
    expect(rateLimit(key, limit, win).allowed).toBe(true);
    expect(rateLimit(key, limit, win).allowed).toBe(true);
    expect(rateLimit(key, limit, win).allowed).toBe(true);
    const blocked = rateLimit(key, limit, win);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    try {
      const key = `w-${Math.random()}`;
      expect(rateLimit(key, 1, 1000).allowed).toBe(true);
      expect(rateLimit(key, 1, 1000).allowed).toBe(false);
      vi.advanceTimersByTime(1001);
      expect(rateLimit(key, 1, 1000).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("clientIpFrom", () => {
  it("takes the first x-forwarded-for ip", () => {
    const req = { headers: { get: (n: string) => (n === "x-forwarded-for" ? "1.2.3.4, 5.6.7.8" : null) } };
    expect(clientIpFrom(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIpFrom({ headers: { get: (n: string) => (n === "x-real-ip" ? "9.9.9.9" : null) } })).toBe("9.9.9.9");
    expect(clientIpFrom({ headers: { get: () => null } })).toBe("unknown");
  });
});
