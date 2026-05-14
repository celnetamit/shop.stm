import { Metadata } from "next";
import { getBookCatalog, getBookCategories } from "@/lib/books-catalog";
import BooksClient from "./books-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Scholarly Books & Monographs | STM Journals",
  description: "Browse our premium collection of academic and scientific books in Nanotechnology, Nursing, and technical writing. Direct access to high-quality monographs and educational titles."
};

export default async function BooksPage() {
  const [books, categories] = await Promise.all([
    getBookCatalog(),
    getBookCategories()
  ]);

  return <BooksClient initialBooks={books} categories={categories} />;
}
