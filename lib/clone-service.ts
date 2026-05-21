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

  // Remove dangerous elements that can execute code or embed external content
  $("iframe, object, embed, form, svg, math, video, audio").remove();

  // Strip all inline event handlers (onclick, onload, onerror, etc.)
  $("*").each((_, el) => {
    const attribs = (el as any).attribs || {};
    for (const attr of Object.keys(attribs)) {
      if (attr.toLowerCase().startsWith("on")) {
        $(el).removeAttr(attr);
      }
    }
  });

  // Remove javascript: protocol from href/src attributes
  $("a, link, img, source, iframe").each((_, el) => {
    for (const attr of ["href", "src", "srcset", "action"]) {
      const val = $(el).attr(attr);
      if (val && val.trim().toLowerCase().startsWith("javascript:")) {
        $(el).removeAttr(attr);
      }
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

function looksLikeSelfMirroredHtml(html: string): boolean {
  const lower = html.toLowerCase();
  const mirroredMentions = (lower.match(/mirrored from/g) || []).length;
  return lower.includes("clone-wrapper") || mirroredMentions >= 2;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; STMCloneBot/1.0)"
      },
      cache: "no-store",
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch ${sourceUrl}: ${message}`);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status}`);
  }

  const html = await response.text();
  if (looksLikeSelfMirroredHtml(html)) {
    throw new Error(
      `Source URL appears to be pointing to this same deployed app (${sourceUrl}). Check SOURCE_SITE_URL.`
    );
  }
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
      if (cached && !looksLikeSelfMirroredHtml(cached.htmlContent)) {
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
      if (cached && !looksLikeSelfMirroredHtml(cached.htmlContent)) {
        return {
          ...cached,
          htmlContent: normalizeCatalogueCurrencyLinks(cached.htmlContent),
          cached: true
        } satisfies ClonedPageResult;
      }
    } catch (dbError) {
      if (!isDbUnavailable(dbError)) throw dbError;
    }
    const now = new Date();
    return {
      id: `fallback:${path}`,
      path,
      sourceUrl: toAbsoluteUrl(path),
      title: "STM Journals",
      htmlContent:
        `<section style="padding:2rem;max-width:960px;margin:0 auto;font-family:Arial,sans-serif;">` +
        `<h1 style="margin:0 0 0.75rem;">STM Journals</h1>` +
        `<p style="margin:0 0 1rem;">We are updating content right now. Please refresh in a moment.</p>` +
        `<p style="margin:0;color:#555;font-size:14px;">Source sync is temporarily unavailable.</p>` +
        `</section>`,
      updatedAt: now,
      createdAt: now,
      cached: false
    } satisfies ClonedPageResult;
  }
}
