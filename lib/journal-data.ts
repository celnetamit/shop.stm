import { readFile } from "node:fs/promises";
import path from "node:path";

export type JournalRow = {
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

export async function loadJournals(): Promise<JournalRow[]> {
  const filePath = path.join(process.cwd(), "journal-price.json");
  const raw = await readFile(filePath, "utf8");
  const normalized = `[${raw}]`;
  return JSON.parse(normalized) as JournalRow[];
}
