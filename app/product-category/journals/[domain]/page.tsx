import { getJournalCatalog } from "@/lib/journal-catalog";
import AgricultureCatalogClient from "@/app/product-category/journals/agriculture/products-client";

export const dynamic = "force-dynamic";

function normalize(input: string) {
  return decodeURIComponent(input).trim().toLowerCase().replace(/[-_]+/g, " ");
}

export default async function DomainJournalsPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const normalized = normalize(domain);

  const journals = (await getJournalCatalog()).filter((r) => r.subject.trim().toLowerCase() === normalized);

  return <AgricultureCatalogClient journals={journals} />;
}
