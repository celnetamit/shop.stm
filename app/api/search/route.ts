import { NextResponse } from "next/server";
import { getJournalCatalog } from "@/lib/journal-catalog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const allJournals = await getJournalCatalog();
  
  const results = allJournals.filter((j) => {
    return (
      j.journalName?.toLowerCase().includes(query) ||
      j.subject?.toLowerCase().includes(query) ||
      j.issn?.toLowerCase().includes(query)
    );
  }).slice(0, 8); // return top 8 results

  return NextResponse.json({ results });
}
