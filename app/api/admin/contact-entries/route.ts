export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

function isMissingContactTable(error: unknown) {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return m.includes("contactentry") && m.includes("does not exist");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const contactEntries = await prisma.contactEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, contactEntries });
  } catch (error) {
    if (isMissingContactTable(error)) return NextResponse.json({ ok: true, contactEntries: [], warning: "Contact entries table missing. Run prisma db push." });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
