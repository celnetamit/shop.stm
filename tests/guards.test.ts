import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUniqueMock, getSessionMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  getSessionMock: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: findUniqueMock } } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentSession: getSessionMock }));

import { requireAdmin } from "@/lib/auth/guards";

describe("requireAdmin (re-derives admin role from the DB)", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    getSessionMock.mockReset();
  });

  it("denies when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);
    expect(await requireAdmin()).toBeNull();
  });

  it("denies a token whose user was demoted in the DB (stale JWT role)", async () => {
    // JWT still claims ADMIN, but the live DB role is USER now.
    getSessionMock.mockResolvedValue({ sub: "u1", email: "a@b.com", role: "ADMIN" });
    findUniqueMock.mockResolvedValue({ role: "USER" });
    expect(await requireAdmin()).toBeNull();
  });

  it("denies when the user no longer exists", async () => {
    getSessionMock.mockResolvedValue({ sub: "u1", email: "a@b.com", role: "ADMIN" });
    findUniqueMock.mockResolvedValue(null);
    expect(await requireAdmin()).toBeNull();
  });

  it("allows a current DB admin", async () => {
    const session = { sub: "u1", email: "a@b.com", role: "ADMIN" as const };
    getSessionMock.mockResolvedValue(session);
    findUniqueMock.mockResolvedValue({ role: "ADMIN" });
    expect(await requireAdmin()).toEqual(session);
  });
});
