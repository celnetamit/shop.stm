import { describe, it, expect, vi } from "vitest";
import { errorResponse } from "@/lib/api-error";

describe("errorResponse (never leak internals)", () => {
  it("returns the generic public message, not the underlying error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const secret = "postgres://user:pass@db-host:5432 connection failed";
    const res = errorResponse("test.ctx", new Error(secret), "Something went wrong.", 500);

    expect(res.status).toBe(500);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Something went wrong.");
    expect(JSON.stringify(body)).not.toContain(secret);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("defaults to status 500 and a default message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = errorResponse("test.ctx", new Error("boom"));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Something went wrong. Please try again.");
    spy.mockRestore();
  });
});
