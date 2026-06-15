export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDomainCountsFromCsv } from "@/lib/journal-catalog";
import { errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const domains = await getDomainCountsFromCsv();
    return NextResponse.json({ ok: true, domains });
  } catch (error) {
    return errorResponse("domains.GET", error, "Failed to load domains.");
  }
}
