import { NextResponse } from "next/server";
import { getJournalCatalog } from "@/lib/journal-catalog";

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
    }
    return c;
  });
}

export async function GET() {
  try {
    const journals = await getJournalCatalog();
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>STM Journals Catalog Feed</title>
    <link>${siteUrl}</link>
    <description>Latest available peer-reviewed scholarly journals from STM Journals.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed/rss" rel="self" type="application/rss+xml" />
`;

    for (const j of journals.slice(0, 50)) { // Limiting to latest/top 50 to keep payload manageable
      const url = `${siteUrl}/product/${j.slug}`;
      rss += `
    <item>
      <title>${escapeXml(j.journalName)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>${escapeXml((j.aboutJournal || "").slice(0, 200))}...</description>
      <category>${escapeXml(j.subject)}</category>
    </item>`;
    }

    rss += `
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=59"
      }
    });
  } catch (error) {
    console.error("RSS Error:", error);
    return new NextResponse("<error>Feed generation failed</error>", { status: 500, headers: { "Content-Type": "application/xml" } });
  }
}
