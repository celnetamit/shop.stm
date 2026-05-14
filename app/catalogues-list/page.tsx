import CataloguesClient from "@/app/catalogues-list/catalogues-client";
import { loadJournals } from "@/lib/journal-data";

export const dynamic = "force-dynamic";

export default async function CataloguesListPage({
  searchParams
}: {
  searchParams: Promise<{ currency?: string }>;
}) {
  const { currency } = await searchParams;
  const initialCurrency = currency?.toUpperCase() === "USD" ? "USD" : "INR";
  const rows = await loadJournals();
  const journals = rows.map((item) => ({
    serialNo: item["S/No"],
    subject: item.Subject,
    journalName: item["Journal Name"],
    abbreviation: item.Abbreviation,
    printInr: item["Subscription\n[Print]"],
    onlineInr: item["Subscription\n[Online]"],
    combinedInr: item["Subscription\n[Print+Online]"],
    printUsd: item["Subscription\n[Print] USD"],
    onlineUsd: item["Subscription\n[Online] USD"],
    combinedUsd: item["Subscription\n[Print+Online] USD"],
    issn: item.issn,
    frequency: item.frequency,
    indexing: item.Indexing
  }));

  return <CataloguesClient journals={journals} initialCurrency={initialCurrency} />;
}
