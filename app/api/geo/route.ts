export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const h = req.headers;
  const countryRaw =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country-code") ||
    "";

  const country = (countryRaw || "").toUpperCase();
  const isInternational = country ? country !== "IN" : false;

  return NextResponse.json({ ok: true, country: country || null, isInternational });
}
