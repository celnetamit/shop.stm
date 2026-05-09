export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export async function GET(req: NextRequest) {
  try {
    const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
    const state = crypto.randomUUID();
    const url = getGoogleAuthUrl(state, origin);
    const existing = req.cookies.get("google_oauth_state")?.value || "";
    const list = existing
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(-4);
    list.push(state);

    const res = NextResponse.redirect(url);
    res.cookies.set("google_oauth_state", list.join(","), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_config", req.url));
  }
}
