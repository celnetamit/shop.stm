export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationOtp } from "@/lib/email";

const OTP_TTL_MINUTES = 10;

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function hashOtp(email: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${email}:${otp}:${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "stm-otp-secret"}`)
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

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ ok: false, error: "Email is already registered." }, { status: 409 });
    }

    const existingVerification = await prisma.emailVerification.findUnique({ where: { email } });
    if (existingVerification?.verifiedAt) {
      return NextResponse.json({ ok: true, verified: true });
    }

    const otp = createOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.emailVerification.upsert({
      where: { email },
      update: {
        otpHash: hashOtp(email, otp),
        expiresAt,
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
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to send OTP" }, { status: 500 });
  }
}
