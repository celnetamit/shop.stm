import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface MasterLinks {
  fullCatalogPdf: string;
  stmPdf: string;
  journalsPubPdf: string;
  sheet: string;
}

export interface CollectionItem {
  title: string;
  count: number;
  href: string;
  pdf: string;
  image: string;
  accent: string;
}

export interface CataloguesData {
  masterLinks: MasterLinks;
  collections: CollectionItem[];
}

const dataFilePath = path.join(process.cwd(), "lib", "catalogues-data.json");

export async function getCataloguesData(): Promise<CataloguesData> {
  try {
    const raw = await readFile(dataFilePath, "utf8");
    return JSON.parse(raw) as CataloguesData;
  } catch (error) {
    console.error("Failed to read catalogues data:", error);
    // Fallback default
    return {
      masterLinks: {
        fullCatalogPdf: "",
        stmPdf: "",
        journalsPubPdf: "",
        sheet: ""
      },
      collections: []
    };
  }
}

export async function saveCataloguesData(data: CataloguesData): Promise<boolean> {
  try {
    await writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Failed to save catalogues data:", error);
    return false;
  }
}
