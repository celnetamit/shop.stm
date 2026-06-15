export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationOtp } from "@/lib/email";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // throttle resends to limit email-bombing / OTP grinding

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function otpSecret() {
  // Prefer dedicated OTP secrets, fall back to the mandatory JWT_SECRET rather than a
  // public hardcoded literal. Throws if no server secret is configured (fail closed).
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("No server secret configured for OTP hashing");
  return secret;
}

function hashOtp(email: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${email}:${otp}:${otpSecret()}`)
    .digest("hex");
}

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = normalizeEmail(body.email);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    // Per-IP cap to stop bulk OTP/email-bombing across many addresses: 15 / 15 min.
    const ipLimit = rateLimit(`otp-send:${clientIpFrom(req)}`, 15, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ ok: false, error: "Email is already registered." }, { status: 409 });
    }

    const existingVerification = await prisma.emailVerification.findUnique({ where: { email } });
    if (existingVerification?.verifiedAt) {
      return NextResponse.json({ ok: true, verified: true });
    }

    // Throttle resends: refuse to issue a fresh OTP if one was sent < cooldown ago.
    // This limits email-bombing of third parties and prevents an attacker from
    // resetting the verify-side attempt counter to brute-force the 6-digit code.
    if (existingVerification && Date.now() - existingVerification.updatedAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existingVerification.updatedAt.getTime())) / 1000);
      return NextResponse.json(
        { ok: false, error: `Please wait ${waitSec}s before requesting another OTP.` },
        { status: 429 }
      );
    }

    const otp = createOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email },
      update: {
        otpHash: hashOtp(email, otp),
        expiresAt,
        // attempts reset is safe here because resends are rate-limited by the
        // cooldown above (the cooldown, not the counter, is the brute-force defense).
        attempts: 0,
        verifiedAt: null
      },
      create: {
        email,
        otpHash: hashOtp(email, otp),
        expiresAt
      }
    });

    const sent = await sendEmailVerificationOtp(email, otp);
    if (!sent) {
      return NextResponse.json({ ok: false, error: "Could not send OTP right now. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, verified: false, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json({ ok: false, error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
