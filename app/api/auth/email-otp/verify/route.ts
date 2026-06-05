export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function hashOtp(email: string, otp: string) {
  return crypto
    .createHash("sha256")
    .update(`${email}:${otp}:${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "stm-otp-secret"}`)
    .digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; otp?: string };
    const email = normalizeEmail(body.email);
    const otp = body.otp?.trim() || "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ ok: false, error: "Enter the 6 digit OTP sent to your email." }, { status: 400 });
    }

    const verification = await prisma.emailVerification.findUnique({ where: { email } });
    if (!verification) {
      return NextResponse.json({ ok: false, error: "Please request an OTP first." }, { status: 404 });
    }

    if (verification.verifiedAt) {
      return NextResponse.json({ ok: true, verified: true });
    }

    if (verification.attempts >= 5) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Please request a new OTP." }, { status: 429 });
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    const otpHash = hashOtp(email, otp);
    if (otpHash !== verification.otpHash) {
      await prisma.emailVerification.update({
        where: { email },
        data: { attempts: { increment: 1 } }
      });
      return NextResponse.json({ ok: false, error: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    await prisma.emailVerification.update({
      where: { email },
      data: {
        verifiedAt: new Date(),
        attempts: 0
      }
    });

    return NextResponse.json({ ok: true, verified: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to verify OTP" }, { status: 500 });
  }
}
