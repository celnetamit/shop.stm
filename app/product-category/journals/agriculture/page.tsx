import { getJournalCatalog } from "@/lib/journal-catalog";
import AgricultureCatalogClient from "@/app/product-category/journals/agriculture/products-client";

export const dynamic = "force-dynamic";

export default async function AgriculturePage() {
  const journals = (await getJournalCatalog()).filter((r) => r.subject.toLowerCase().includes("agriculture"));

  return <AgricultureCatalogClient journals={journals} />;
}
