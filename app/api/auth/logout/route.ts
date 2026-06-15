export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}

export async function GET(request: Request) {
  // Build the redirect target only from a server-trusted base URL (or the request's
  // own origin) — never from attacker-controllable X-Forwarded-* / Host headers,
  // which would allow an open-redirect logout-phishing link.
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = new URL("/login", base);
  const res = NextResponse.redirect(url);
  clearAuthCookie(res);
  return res;
}
