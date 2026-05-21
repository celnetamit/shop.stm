import { NextResponse } from "next/server";
import { seedDefaultTemplates } from "@/lib/email";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[API/Admin/EmailSync] Manually triggering override sequence...");
    await seedDefaultTemplates();
    return NextResponse.json({ ok: true, message: "Database records successfully harmonized with hardcoded source tree." });
  } catch (error) {
    console.error("[API/Admin/EmailSync] Failure:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Override sequence failed." }, { status: 500 });
  }
}
