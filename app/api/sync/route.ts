export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getClonedPath } from "@/lib/clone-service";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { path?: string; forceRefresh?: boolean };
    const path = typeof body.path === "string" ? body.path : "/";
    const page = await getClonedPath(path, !!body.forceRefresh);
    return NextResponse.json({ ok: true, path: page.path, updatedAt: page.updatedAt });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to sync the requested page." },
      { status: 500 }
    );
  }
}
