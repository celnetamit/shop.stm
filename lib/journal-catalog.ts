import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadJournals } from "@/lib/journal-data";
import * as cheerio from "cheerio";

export type FocusScopeItem = {
  title: string;
  contentHtml: string;
};

export type JournalCatalogItem = {
  startedSince: string | null;
  id: string;
  slug: string;
  journalName: string;
  subject: string;
  issn: string | null;
  frequency: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  imageUrl: string | null;
  aboutJournal: string | null;
  focusAndScope: string | null;
  abbreviation: string | null;
  focusScopeItems: FocusScopeItem[];
  indexing: string | null;
};

type CsvRow = Record<string, string>;

let csvCache: CsvRow[] | null = null;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0]?.trim()) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...data] = rows;
  if (!header) return [];
  return data.map((values) => {
    const mapped: CsvRow = {};
    header.forEach((key, idx) => {
      mapped[key.trim()] = (values[idx] || "").trim();
    });
    return mapped;
  });
}

async function loadCsvRows(): Promise<CsvRow[]> {
  if (csvCache) return csvCache;
  const filePath = path.join(process.cwd(), "journals_entry.csv");
  const raw = await readFile(filePath, "utf8");
  csvCache = parseCsv(raw);
  return csvCache;
}

let focusScopeCache: CsvRow[] | null = null;

async function loadFocusScopeRows(): Promise<CsvRow[]> {
  if (focusScopeCache) return focusScopeCache;
  try {
    const filePath = path.join(process.cwd(), "focus-and-scope.csv");
    const raw = await readFile(filePath, "utf8");
    focusScopeCache = parseCsv(raw);
    return focusScopeCache;
  } catch (e) {
    console.error("Error loading focus-and-scope.csv:", e);
    return [];
  }
}

function processFocusScopeItems(html: string | null): FocusScopeItem[] {
  if (!html) return [];
  try {
    const $ = cheerio.load(html);
    const items: FocusScopeItem[] = [];
    
    $("ul").first().children("li").each((_, el) => {
      const $el = $(el);
      const title = $el.find("> strong").first().text().replace(/[:\-\s]+$/, "").trim();
      
      const $clone = $el.clone();
      $clone.find("> strong").first().remove();
      
      const contentHtml = $clone.html()?.trim().replace(/^[:\-\s]+/, "") || "";
      
      items.push({
        title: title || "Focus Topic",
        contentHtml
      });
    });
    
    return items;
  } catch (e) {
    console.error("Error parsing focus scope html:", e);
    return [];
  }
}

export async function getDomainCountsFromCsv(): Promise<Array<{ domain: string; count: number }>> {
  const rows = await loadCsvRows();
  const map = new Map<string, number>();
  for (const r of rows) {
    const domain = (r["Domain"] || "").trim();
    if (!domain) continue;
    map.set(domain, (map.get(domain) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

export async function getJournalCatalog(): Promise<JournalCatalogItem[]> {
  const [priceRows, csvRows, scopeRows] = await Promise.all([
    loadJournals(),
    loadCsvRows(),
    loadFocusScopeRows()
  ]);

  const csvByName = new Map<string, CsvRow>();
  for (const r of csvRows) {
    const name = r["Journal Name"];
    if (!name) continue;
    const key = normalizeName(name);
    if (!csvByName.has(key)) csvByName.set(key, r);
  }

  const scopeByAbbr = new Map<string, CsvRow>();
  for (const r of scopeRows) {
    const abbr = (r["Abbreviation"] || "").trim().toLowerCase();
    if (!abbr) continue;
    scopeByAbbr.set(abbr, r);
  }

  return priceRows.map((r) => {
    const journalName = r["Journal Name"];
    const csv = csvByName.get(normalizeName(journalName));
    const eIssn = csv?.["e-ISSN"] || "";
    const pIssn = csv?.["p-ISSN"] || "";
    const issn = r.issn || eIssn || pIssn || null;
    
    const abbreviation = (csv?.["Abbreviation"] || "").trim();
    const matchedScope = abbreviation ? scopeByAbbr.get(abbreviation.toLowerCase()) : null;
    
    const focusScopeHtml = matchedScope?.["Focus & Scope"] || null;
    const focusScopeItems = focusScopeHtml ? processFocusScopeItems(focusScopeHtml) : [];

    return {
      id: String(r["S/No"]),
      slug: slugify(journalName),
      journalName,
      subject: r.Subject,
      startedSince: csv?.["Started Since"] || null,
      issn,
      frequency: r.frequency || csv?.Frequency || null,
      printInr: r["Subscription\n[Print]"],
      onlineInr: r["Subscription\n[Online]"],
      combinedInr: r["Subscription\n[Print+Online]"],
      imageUrl: r.imageUrl || csv?.["Journal Image URL"] || null,
      aboutJournal: r.aboutJournal || csv?.["About Journal"] || null,
      focusAndScope: csv?.["Focus and Scope (Keywords)"] || null,
      abbreviation: abbreviation || null,
      focusScopeItems,
      indexing: r.Indexing || csv?.Indexing || null
    };
  });
}

export async function getJournalBySlug(slug: string): Promise<JournalCatalogItem | null> {
  const all = await getJournalCatalog();
  return all.find((j) => j.slug === slug) || null;
}
