export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { roleForEmail } from "@/lib/auth/admin-emails";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    const isAdminByEmail = roleForEmail(user.email) === "ADMIN";
    const effectiveRole = isAdminByEmail ? "ADMIN" : user.role;
    if (isAdminByEmail && user.role !== "ADMIN") {
      await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    }

    const token = await signSession({ sub: user.id, email: user.email, role: effectiveRole });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: effectiveRole } });
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Login failed" }, { status: 500 });
  }
}
