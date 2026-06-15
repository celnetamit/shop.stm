export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { roleForEmail } from "@/lib/auth/admin-emails";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; email?: string; password?: string; role?: "LIBRARIAN" | "AGENCY" | "USER" | "STUDENT" | "SCHOLAR" | "MANAGER" };
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

    const verification = await prisma.emailVerification.findUnique({ where: { email } });
    if (!verification?.verifiedAt) {
      return NextResponse.json({ ok: false, error: "Please verify your email with OTP before creating an account." }, { status: 403 });
    }

    const passwordHash = await hashPassword(password);
    // SECURITY: never trust a client-supplied privileged role. Only allow a fixed
    // set of self-service, non-privileged roles; everything else falls back to USER.
    // ADMIN is granted solely from the server-side ADMIN_EMAILS allow-list.
    const SELF_SERVICE_ROLES = new Set(["USER", "LIBRARIAN", "AGENCY", "STUDENT", "SCHOLAR"]);
    const requestedRole = typeof body.role === "string" && SELF_SERVICE_ROLES.has(body.role) ? body.role : "USER";
    const role = roleForEmail(email) === "ADMIN" ? "ADMIN" : requestedRole;
    const user = await prisma.user.create({
      data: { name, email, emailVerified: true, emailVerifiedAt: verification.verifiedAt, passwordHash, provider: "credentials", role }
    });

    // Dispatch emails silently, catching any error so as not to break overall HTTP stream
    try {
      const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
      const data = { name: name || "User", email, role };
      await sendTemplatedEmail("USER_WELCOME", email, data);
      await sendAdminNotification("USER_WELCOME_ADMIN", data);
    } catch (e) {
      console.error("Auth Email Fail", e);
    }

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role } });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ ok: false, error: "Registration failed. Please try again." }, { status: 500 });
  }
}
