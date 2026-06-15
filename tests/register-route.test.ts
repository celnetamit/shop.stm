import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// vi.mock is hoisted; use vi.hoisted so the factory can reference our spy.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null), // no existing user
      create: createMock
    },
    emailVerification: {
      findUnique: vi.fn().mockResolvedValue({ verifiedAt: new Date() }) // email pre-verified
    }
  }
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn().mockResolvedValue("hashed") }));
vi.mock("@/lib/email", () => ({ sendTemplatedEmail: vi.fn(), sendAdminNotification: vi.fn() }));

import { POST } from "@/app/api/auth/register/route";

function makeReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

function createdRole() {
  return createMock.mock.calls[0][0].data.role as string;
}

describe("register role allow-list (C2 — privilege escalation guard)", () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockImplementation((args: { data: { email: string; role: string } }) => ({
      id: "u1",
      email: args.data.email,
      role: args.data.role
    }));
  });

  it("forces a privileged requested role (MANAGER) down to USER", async () => {
    const res = await POST(makeReq({ email: "user@test.com", password: "password123", role: "MANAGER" }));
    expect(res.status).toBe(200);
    expect(createdRole()).toBe("USER");
  });

  it("allows a self-service role (LIBRARIAN)", async () => {
    await POST(makeReq({ email: "user2@test.com", password: "password123", role: "LIBRARIAN" }));
    expect(createdRole()).toBe("LIBRARIAN");
  });

  it("ignores an arbitrary/unknown role string", async () => {
    await POST(makeReq({ email: "user3@test.com", password: "password123", role: "SUPERADMIN" }));
    expect(createdRole()).toBe("USER");
  });
});
