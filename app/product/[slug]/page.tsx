import { notFound } from "next/navigation";
import { getJournalBySlug, getJournalCatalog } from "@/lib/journal-catalog";
import ProductDetailClient from "@/app/product/[slug]/product-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const journal = await getJournalBySlug(slug);
  if (!journal) {
    return { title: "Journal Not Found" };
  }
  const description = stripHtml(
    journal.aboutJournal || `${journal.journalName} journal subscription, pricing, and details at STM Journals.`
  ).slice(0, 160);

  return {
    title: journal.journalName,
    description,
    alternates: {
      canonical: `/product/${journal.slug}`
    },
    openGraph: {
      title: journal.journalName,
      description,
      type: "article",
      images: journal.imageUrl ? [{ url: journal.imageUrl }] : undefined
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [journal, all] = await Promise.all([getJournalBySlug(slug), getJournalCatalog()]);
  if (!journal) notFound();

  const description = stripHtml(journal.aboutJournal || `${journal.journalName} is a peer-reviewed journal in ${journal.subject}.`);
  const about = stripHtml(journal.aboutJournal || `This journal publishes contributions in ${journal.subject}.`);
  const focus = stripHtml(journal.focusAndScope || `${journal.subject}, research publications, review papers, and applied studies.`);
  const domains = Array.from(new Set(all.map((j) => j.subject).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  return <ProductDetailClient journal={journal} domains={domains} description={description} about={about} focus={focus} />;
}
