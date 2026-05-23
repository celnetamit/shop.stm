export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, exchangeGoogleCodeForOrigin, fetchGoogleProfile } from "@/lib/auth/google";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth/session";
import { roleForEmail } from "@/lib/auth/admin-emails";

export async function GET(req: NextRequest) {
  try {
    const appBase = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const stateCookie = req.cookies.get("google_oauth_state")?.value || "";
    const validStates = stateCookie
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!code || !state || !validStates.includes(state)) {
      return NextResponse.redirect(`${appBase}/login?error=google_state`);
    }

    const accessToken = await exchangeGoogleCodeForOrigin(code, appBase);
    const profile = await fetchGoogleProfile(accessToken);
    const normalizedEmail = profile.email.toLowerCase();
    const emailBasedRole = roleForEmail(normalizedEmail);

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const isNew = !user;

    if (isNew) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: profile.name,
          role: emailBasedRole,
          provider: "google",
          providerId: profile.id
        }
      });
      
      // Trigger transactional email workflows only for first-time Google registrations
      try {
        const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
        const data = { name: profile.name || "User", email: normalizedEmail };
        await sendTemplatedEmail("USER_WELCOME", normalizedEmail, data);
        await sendAdminNotification("USER_WELCOME_ADMIN", data);
      } catch (e) {
        console.error("Google Auth Email Fail", e);
      }
    } else {
      if (!user) {
        throw new Error("User lookup failed");
      }
      const nextRole = emailBasedRole === "ADMIN" ? "ADMIN" : user.role;
      user = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          name: profile.name,
          role: nextRole,
          provider: "google",
          providerId: profile.id
        }
      });
    }

    if (!user) {
      throw new Error("User creation/login failed");
    }

    const effectiveRole = user.role;
    const token = await signSession({ sub: user.id, email: user.email, role: effectiveRole });

    const res = NextResponse.redirect(`${appBase}${effectiveRole === "ADMIN" ? "/admin" : "/"}`);
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    res.cookies.set("google_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return res;
  } catch {
    const appBase = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
    return NextResponse.redirect(`${appBase}/login?error=google_auth`);
  }
}
