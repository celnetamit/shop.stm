export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
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
  const hdrs = await headers();
  const forwardedProto = hdrs.get("x-forwarded-proto");
  const forwardedHost = hdrs.get("x-forwarded-host");
  const host = hdrs.get("host");
  const fallbackUrl = new URL(request.url);

  const proto = forwardedProto || fallbackUrl.protocol.replace(":", "");
  const resolvedHost = forwardedHost || host || fallbackUrl.host;
  const url = new URL(`${proto}://${resolvedHost}/login`);
  const res = NextResponse.redirect(url);
  clearAuthCookie(res);
  return res;
}
