export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true }
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: session.sub,
      name: dbUser?.name || null,
      email: session.email,
      role: session.role
    }
  });
}
