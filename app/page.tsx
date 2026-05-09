import { getClonedPath } from "@/lib/clone-service";
import { getDomainCountsFromCsv, getJournalCatalog } from "@/lib/journal-catalog";
import HomeSections from "@/app/components/home-sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [page, domains, allJournals] = await Promise.all([
    getClonedPath("/"),
    getDomainCountsFromCsv(),
    getJournalCatalog()
  ]);
  const trending = [...allJournals].sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <main className="clone-wrapper">
      <div dangerouslySetInnerHTML={{ __html: page.htmlContent }} />
      <HomeSections domains={domains} journals={trending} />
    </main>
  );
}
