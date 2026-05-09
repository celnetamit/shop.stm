export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCodeForOrigin, fetchGoogleProfile } from "@/lib/auth/google";
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

    const origin = new URL(req.url).origin;
    const accessToken = await exchangeGoogleCodeForOrigin(code, origin);
    const profile = await fetchGoogleProfile(accessToken);
    const normalizedEmail = profile.email.toLowerCase();
    const role = roleForEmail(normalizedEmail);

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: profile.name,
        role,
        provider: "google",
        providerId: profile.id
      },
      create: {
        email: normalizedEmail,
        name: profile.name,
        role,
        provider: "google",
        providerId: profile.id
      }
    });

    const token = await signSession({ sub: user.id, email: user.email, role });

    const res = NextResponse.redirect(`${appBase}${role === "ADMIN" ? "/admin" : "/"}`);
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
