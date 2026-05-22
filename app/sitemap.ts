import type { MetadataRoute } from "next";
import { getJournalCatalog } from "@/lib/journal-catalog";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const journals = await getJournalCatalog().catch(() => []);
  const domains = Array.from(new Set(journals.map((j) => j.subject).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/catalogues",
    "/catalogues-list",
    "/contact-us",
    "/get-proforma-invoice-quote",
    "/cart",
    "/login",
    "/register"
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  }));

  const domainRoutes: MetadataRoute.Sitemap = domains.map((domain) => ({
    url: `${siteUrl}/product-category/journals/${encodeURIComponent(domain)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  const productRoutes: MetadataRoute.Sitemap = journals.map((j) => ({
    url: `${siteUrl}/product/${j.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9
  }));

  return [...staticRoutes, ...domainRoutes, ...productRoutes];
}
