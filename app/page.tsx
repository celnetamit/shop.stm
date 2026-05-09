import { getDomainCountsFromCsv, getJournalCatalog } from "@/lib/journal-catalog";
import HomeSections from "@/app/components/home-sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [domains, allJournals] = await Promise.all([getDomainCountsFromCsv(), getJournalCatalog()]);
  const trending = [...allJournals].sort(() => Math.random() - 0.5).slice(0, 8);
  const domainCount = domains.length;
  const totalJournals = allJournals.length;

  return (
    <main className="home-page-v3">
      <section className="home-v3-hero">
        <div className="home-v3-hero-content">
          <p className="home-v3-kicker">Scholarly Publishing Marketplace</p>
          <h1>Find The Right Journal Subscription For Your Institution</h1>
          <p>
            Explore verified STM titles across disciplines, compare plans, and request fast institutional proforma
            support in one modern workflow.
          </p>
          <div className="home-v3-hero-actions">
            <a href="/catalogues-list">Explore Catalogues</a>
            <a href="/get-proforma-invoice-quote">Request Proforma Quote</a>
          </div>
        </div>
        <div className="home-v3-hero-stats">
          <article><strong>{totalJournals}</strong><span>Active Journal Listings</span></article>
          <article><strong>{domainCount}</strong><span>Academic Disciplines</span></article>
          <article><strong>24/7</strong><span>Digital Access Availability</span></article>
        </div>
      </section>
      <HomeSections domains={domains} journals={trending} />
    </main>
  );
}
