import { readFile } from "node:fs/promises";
import path from "node:path";

export type BookItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  isbn: string | null;
  originalPriceInr: number;
  salePriceInr: number;
  imageUrl: string | null;
  description: string | null;
};

type JsonBookInput = {
  id: string;
  title: string;
  category: string;
  isbn?: string;
  originalPriceInr: number;
  salePriceInr: number;
  imageUrl?: string;
  description?: string;
};

let booksCache: BookItem[] | null = null;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getBookCatalog(): Promise<BookItem[]> {
  if (booksCache) return booksCache;

  try {
    const filePath = path.join(process.cwd(), "lib", "books-data.json");
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as JsonBookInput[];

    booksCache = parsed.map((b) => ({
      id: b.id,
      slug: slugify(b.title),
      title: b.title,
      category: b.category,
      isbn: b.isbn || null,
      originalPriceInr: Number(b.originalPriceInr),
      salePriceInr: Number(b.salePriceInr),
      imageUrl: b.imageUrl || null,
      description: b.description || null
    }));

    return booksCache;
  } catch (error) {
    console.error("Failed to load books catalog JSON:", error);
    return [];
  }
}

export async function getBookBySlug(slug: string): Promise<BookItem | null> {
  const all = await getBookCatalog();
  return all.find((b) => b.slug === slug) || null;
}

export async function getBookCategories(): Promise<string[]> {
  const all = await getBookCatalog();
  const unique = new Set(all.map((b) => b.category).filter(Boolean));
  return Array.from(unique).sort();
}
