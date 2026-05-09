import { readFile } from "node:fs/promises";
import path from "node:path";
import CataloguesClient from "@/app/catalogues-list/catalogues-client";

export const dynamic = "force-dynamic";

type JournalRow = {
  "S/No": number;
  Subject: string;
  "Journal Name": string;
  Abbreviation: string;
  "Subscription\n[Print]": number;
  "Subscription\n[Online]": number;
  "Subscription\n[Print+Online]": number;
  "Subscription\n[Print] USD": number;
  "Subscription\n[Online] USD": number;
  "Subscription\n[Print+Online] USD": number;
  issn: string | null;
  frequency: string | null;
  Indexing: string | null;
};

async function loadJournals(): Promise<JournalRow[]> {
  const filePath = path.join(process.cwd(), "journal-price.json");
  const raw = await readFile(filePath, "utf8");
  const normalized = `[${raw}]`;
  return JSON.parse(normalized) as JournalRow[];
}

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
