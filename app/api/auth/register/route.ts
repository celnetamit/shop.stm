export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signSession, AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { roleForEmail } from "@/lib/auth/admin-emails";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; email?: string; password?: string; role?: "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR" };
    const name = body.name?.trim() || null;
    const email = body.email?.trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ ok: false, error: "Email and password (min 8 chars) are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const requestedRole = body.role;
    const role = roleForEmail(email) === "ADMIN" ? "ADMIN" : (requestedRole || "USER");
    const user = await prisma.user.create({
      data: { name, email, passwordHash, provider: "credentials", role }
    });

    // Dispatch emails silently, catching any error so as not to break overall HTTP stream
    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const data = { name: name || "User", email };
      await sendTemplatedEmail("USER_WELCOME", email, data);
      await sendAdminNotification("USER_WELCOME_ADMIN", data);
    } catch (e) {
      console.error("Auth Email Fail", e);
    }

    const token = await signSession({ sub: user.id, email: user.email, role });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role } });
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Registration failed" }, { status: 500 });
  }
}
