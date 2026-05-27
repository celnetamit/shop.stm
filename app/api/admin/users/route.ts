export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: "USER" | "ADMIN" | "MANAGER" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR";
      accessPermissions?: Record<string, boolean>;
    };

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const name = body.name?.trim() || null;
    if (!email || password.length < 8) {
      return NextResponse.json({ ok: false, error: "Email and password (min 8 chars) are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ ok: false, error: "Email is already registered." }, { status: 409 });

    const allowedRoles = new Set(["USER", "ADMIN", "MANAGER", "LIBRARIAN", "AGENCY", "STUDENT", "SCHOLAR"]);
    const role = body.role && allowedRoles.has(body.role) ? body.role : "USER";

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        provider: "credentials",
        role,
        accessPermissions: body.accessPermissions || {}
      }
    });

    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const data = { name: name || "User", email };
      await sendTemplatedEmail("USER_WELCOME", email, data);
      await sendAdminNotification("USER_WELCOME_ADMIN", data);
    } catch (e) {
      console.error("Admin user create email fail", e);
    }

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
