import { NextResponse } from "next/server";
import { getDomainCountsFromCsv } from "@/lib/journal-catalog";

export async function GET() {
  try {
    const domains = await getDomainCountsFromCsv();
    return NextResponse.json({ ok: true, domains });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
