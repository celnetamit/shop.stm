export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getCataloguesData, saveCataloguesData, CataloguesData } from "@/lib/catalogues-data";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await getCataloguesData();
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    const success = await saveCataloguesData(body as CataloguesData);
    if (!success) {
      return NextResponse.json({ ok: false, error: "Failed to save configuration data" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Catalogues updated successfully" });
  } catch (error) {
    console.error("[CATALOGUES_API_POST]", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
