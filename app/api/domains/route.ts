export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDomainCountsFromCsv } from "@/lib/journal-catalog";

export async function GET() {
  try {
    const domains = await getDomainCountsFromCsv();
    const total = domains.reduce((sum, item) => sum + item.count, 0);
    return NextResponse.json({ ok: true, domains, total });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
