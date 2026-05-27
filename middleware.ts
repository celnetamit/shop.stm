import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "auth_token";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) return new TextEncoder().encode("missing-secret");
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<{ role: "USER" | "ADMIN" | "MANAGER" } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role === "ADMIN") return { role: "ADMIN" };
    if (payload.role === "MANAGER") return { role: "MANAGER" };
    return { role: "USER" };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (pathname.startsWith("/account") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "ADMIN" && session.role !== "MANAGER") return NextResponse.redirect(new URL("/account", req.url));
  }

  if (pathname.startsWith("/checkout") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout/:path*"]
};
