export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { deleteJournal } from "@/lib/journal-data";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const serialNo = parseInt(id, 10);

    if (isNaN(serialNo)) {
      return NextResponse.json({ ok: false, error: "Invalid serial number ID" }, { status: 400 });
    }

    const success = await deleteJournal(serialNo);
    if (!success) {
      return NextResponse.json({ ok: false, error: "Journal not found" }, { status: 404 });
    }

    // Purge the Next.js Data Cache and Router Cache to reflect deletion immediately
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, message: "Journal deleted successfully" });
  } catch (error) {
    console.error("[JOURNAL_DELETE]", error);
    return NextResponse.json({ ok: false, error: "Failed to delete journal" }, { status: 500 });
  }
}
