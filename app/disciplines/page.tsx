import { getDomainCountsFromCsv } from "@/lib/journal-catalog";
import DisciplinesClient from "./disciplines-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Research Disciplines | STM Journals",
  description: "Browse all 24 scholarly research disciplines across Science, Technology, and Medicine to find active peer-reviewed journals.",
};

export default async function DisciplinesPage() {
  const domains = await getDomainCountsFromCsv();

  return (
    <main style={{
      maxWidth: "1300px",
      margin: "40px auto",
      padding: "0 20px",
      fontFamily: "Outfit, sans-serif"
    }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "40px",
          fontWeight: "800",
          color: "var(--text)",
          marginBottom: "12px"
        }}>
          Research Disciplines
        </h1>
        <p style={{
          fontSize: "16px",
          color: "var(--muted)",
          maxWidth: "600px",
          margin: "0 auto",
          lineHeight: "1.6"
        }}>
          Explore our collection of peer-reviewed journals across {domains.length} scholarly domains. Find specialized research, board members, and subscription opportunities.
        </p>
      </div>

      <DisciplinesClient initialDomains={domains} />
    </main>
  );
}
