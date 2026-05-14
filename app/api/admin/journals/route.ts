export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { loadJournals, saveJournal, type JournalRow } from "@/lib/journal-data";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const journals = await loadJournals();
    return NextResponse.json({ ok: true, journals });
  } catch (error) {
    console.error("[JOURNALS_GET]", error);
    return NextResponse.json({ ok: false, error: "Failed to load journals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as Partial<JournalRow>;
    
    if (!body["Journal Name"]) {
      return NextResponse.json({ ok: false, error: "Journal Name is required" }, { status: 400 });
    }

    const updated = await saveJournal(body as Partial<JournalRow> & { "Journal Name": string });
    
    // Purge the Next.js Data Cache and Router Cache to reflect changes immediately
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, journal: updated });
  } catch (error) {
    console.error("[JOURNALS_POST]", error);
    return NextResponse.json({ ok: false, error: "Failed to save journal" }, { status: 500 });
  }
}
