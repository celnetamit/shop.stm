import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

function isMissingProformaTable(error: unknown) {
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return (m.includes("proformaquote") || m.includes("proformaquoteitem")) && m.includes("does not exist");
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const proformas = await prisma.proformaQuote.findMany({ include: { items: true, createdBy: true }, orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, proformas });
  } catch (error) {
    if (isMissingProformaTable(error)) return NextResponse.json({ ok: true, proformas: [], warning: "Proforma tables missing. Run prisma db push." });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
