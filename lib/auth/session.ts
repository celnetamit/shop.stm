import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "auth_token";

type SessionPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN" | "MANAGER" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR";
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Set it in your .env file.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: String(payload.role || "USER") as SessionPayload["role"]
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}
