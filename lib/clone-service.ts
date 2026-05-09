import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

const SOURCE_SITE_URL = (process.env.SOURCE_SITE_URL || "https://shop.stmjournals.com").replace(/\/$/, "");

function normalizePath(path: string): string {
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return cleaned.replace(/\/+$/, "") || "/";
}

function toAbsoluteUrl(path: string): string {
  if (path === "/") return SOURCE_SITE_URL;
  return `${SOURCE_SITE_URL}${path}`;
}

function rewriteHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove scripts that can break hydration/security in the clone.
  $("script").remove();
  // Remove mirrored top navigation/header to avoid duplicate headers.
  $("header, #masthead, .site-header, .main-header, .navbar, nav").remove();
  // Extra hardening for source theme wrappers that aren't semantic <header>/<nav>.
  $(".thrv_wrapper.thrv_global, .thrv_wrapper.thrv_symbol, .thrv_symbol, .tve-header, .tcb-header").remove();
  // If a top block still contains STM branding and menu/login links, strip it.
  $("div, section").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").toLowerCase();
    const looksLikeBrand = text.includes("stm journals");
    const looksLikeTopMenu =
      text.includes("home") &&
      (text.includes("browse all disciplines") || text.includes("get proforma/quote")) &&
      (text.includes("login") || text.includes("register") || text.includes("my cart"));
    if (looksLikeBrand && looksLikeTopMenu) {
      $(el).remove();
    }
  });

  $("a, link").each((_, el) => {
    const attr = el.tagName === "a" ? "href" : "href";
    const val = $(el).attr(attr);
    if (!val) return;
    if (val.startsWith(SOURCE_SITE_URL)) {
      $(el).attr(attr, val.replace(SOURCE_SITE_URL, ""));
    }
  });

  // Preserve source intent for catalogue currency buttons by normalizing hrefs.
  $("a").each((_, el) => {
    const anchor = $(el);
    const text = anchor.text().replace(/\s+/g, " ").trim().toLowerCase();
    const href = anchor.attr("href");
    if (!href) return;
    const isCataloguesHref =
      href === "/catalogues-list" ||
      href.startsWith("/catalogues-list?") ||
      href.includes("/catalogues-list");
    if (!isCataloguesHref) return;

    if (text.includes("usd") || text.includes("international")) {
      anchor.attr("href", "/catalogues-list?currency=USD");
      return;
    }
    if (text.includes("inr") || text.includes("india")) {
      anchor.attr("href", "/catalogues-list?currency=INR");
    }
  });

  $("img, source").each((_, el) => {
    ["src", "srcset"].forEach((attr) => {
      const val = $(el).attr(attr);
      if (!val) return;
      if (val.startsWith("/")) {
        $(el).attr(attr, `${SOURCE_SITE_URL}${val}`);
      }
    });
  });

  return $.html();
}

type ClonedPageResult = {
  id: string;
  path: string;
  sourceUrl: string;
  title: string | null;
  htmlContent: string;
  updatedAt: Date;
  createdAt: Date;
  cached: boolean;
};

function normalizeCatalogueCurrencyLinks(html: string): string {
  // Re-run link normalization against previously cached HTML so old cache
  // starts emitting explicit URL filters without forcing a re-fetch.
  return rewriteHtml(html);
}

function isDbUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("prismaclientinitializationerror") ||
    message.includes("connection refused")
  );
}

export async function fetchAndCachePath(pathInput: string) {
  const path = normalizePath(pathInput);
  const sourceUrl = toAbsoluteUrl(path);
  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; STMCloneBot/1.0)"
      },
      cache: "no-store"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch ${sourceUrl}: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);
  }

  const html = await response.text();
  const rewritten = rewriteHtml(html);
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || null;

  try {
    const saved = await prisma.clonedPage.upsert({
      where: { path },
      update: { htmlContent: rewritten, title, sourceUrl },
      create: { path, htmlContent: rewritten, title, sourceUrl }
    });
    return { ...saved, cached: true } satisfies ClonedPageResult;
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    const now = new Date();
    return {
      id: `uncached:${path}`,
      path,
      sourceUrl,
      title,
      htmlContent: rewritten,
      updatedAt: now,
      createdAt: now,
      cached: false
    } satisfies ClonedPageResult;
  }
}

export async function getClonedPath(pathInput: string, forceRefresh = false) {
  const path = normalizePath(pathInput);
  if (!forceRefresh) {
    try {
      const cached = await prisma.clonedPage.findUnique({ where: { path } });
      if (cached) {
        return {
          ...cached,
          htmlContent: normalizeCatalogueCurrencyLinks(cached.htmlContent),
          cached: true
        } satisfies ClonedPageResult;
      }
    } catch (error) {
      if (!isDbUnavailable(error)) throw error;
    }
  }

  try {
    return await fetchAndCachePath(path);
  } catch (error) {
    // If live fetch fails, serve stale cache when available.
    try {
      const cached = await prisma.clonedPage.findUnique({ where: { path } });
      if (cached) {
        return {
          ...cached,
          htmlContent: normalizeCatalogueCurrencyLinks(cached.htmlContent),
          cached: true
        } satisfies ClonedPageResult;
      }
    } catch (dbError) {
      if (!isDbUnavailable(dbError)) throw dbError;
    }
    throw error;
  }
}
