import { readFile, writeFile } from "node:fs/promises";
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
  imageUrl?: string | null;
};

export async function loadJournals(): Promise<JournalRow[]> {
  const filePath = path.join(process.cwd(), "journal-price.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as JournalRow[];
}

export async function saveJournals(journals: JournalRow[]): Promise<void> {
  const filePath = path.join(process.cwd(), "journal-price.json");
  await writeFile(filePath, JSON.stringify(journals, null, 4), "utf8");
}

export async function saveJournal(journal: Partial<JournalRow> & { "Journal Name": string }): Promise<JournalRow> {
  const all = await loadJournals();
  const existingIdx = journal["S/No"] ? all.findIndex((j) => j["S/No"] === journal["S/No"]) : -1;

  let updatedJournal: JournalRow;

  if (existingIdx > -1) {
    // Update existing
    updatedJournal = {
      ...all[existingIdx],
      ...journal,
      "S/No": all[existingIdx]["S/No"] // keep existing S/No
    } as JournalRow;
    all[existingIdx] = updatedJournal;
  } else {
    // Create new
    const maxSNo = all.reduce((max, cur) => (cur["S/No"] > max ? cur["S/No"] : max), 0);
    updatedJournal = {
      "S/No": maxSNo + 1,
      Subject: journal.Subject || "General",
      "Journal Name": journal["Journal Name"],
      Abbreviation: journal.Abbreviation || journal["Journal Name"].toLowerCase().replace(/[^a-z0-9]+/g, ""),
      "Subscription\n[Print]": journal["Subscription\n[Print]"] || 0,
      "Subscription\n[Online]": journal["Subscription\n[Online]"] || 0,
      "Subscription\n[Print+Online]": journal["Subscription\n[Print+Online]"] || 0,
      "Subscription\n[Print] USD": journal["Subscription\n[Print] USD"] || 0,
      "Subscription\n[Online] USD": journal["Subscription\n[Online] USD"] || 0,
      "Subscription\n[Print+Online] USD": journal["Subscription\n[Print+Online] USD"] || 0,
      issn: journal.issn || null,
      frequency: journal.frequency || null,
      Indexing: journal.Indexing || null,
      imageUrl: journal.imageUrl || null
    };
    all.push(updatedJournal);
  }

  await saveJournals(all);
  return updatedJournal;
}

export async function deleteJournal(serialNo: number): Promise<boolean> {
  const all = await loadJournals();
  const filtered = all.filter((j) => j["S/No"] !== serialNo);
  if (filtered.length === all.length) {
    return false; // not found, nothing deleted
  }
  await saveJournals(filtered);
  return true;
}
