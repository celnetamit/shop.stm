import * as cheerio from "cheerio";
import DOMPurify from "isomorphic-dompurify";
import { prisma } from "@/lib/prisma";

const SOURCE_SITE_URL = (process.env.SOURCE_SITE_URL || "https://shop.stmjournals.com").replace(/\/$/, "");

// Robust allow-list sanitization of the mirrored third-party HTML. The cheerio pass
// above handles transformation (link rewriting, header removal, image absolutization);
// this pass is the security boundary that neutralizes scripts, event handlers and
// dangerous URL schemes that a hand-rolled denylist can miss (CSS/SVG/MathML vectors,
// entity-encoded `javascript:`, `data:`/`vbscript:` URLs, `<base>` hijacking, etc.).
// Presentation is preserved: <style>/<link rel=stylesheet>/inline styles/images survive.
function sanitizeClonedHtml(html: string): string {
  try {
    return DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      USE_PROFILES: { html: true },
      // Keep document-level presentation tags DOMPurify would otherwise drop.
      ADD_TAGS: ["style", "link", "meta"],
      ADD_ATTR: ["target", "srcset", "sizes", "loading", "media", "rel", "type", "charset", "content", "name", "property"],
      FORBID_TAGS: ["script", "base", "iframe", "object", "embed", "form", "noscript"],
      FORBID_ATTR: ["formaction", "ping"],
      ALLOW_DATA_ATTR: true
    });
  } catch (error) {
    // Never let a sanitizer failure crash the page — fall back to the cheerio-stripped
    // HTML (scripts/handlers already removed) rather than serving raw or nothing.
    console.error("DOMPurify sanitize failed; serving cheerio-stripped HTML instead", error);
    return html;
  }
}

function normalizePath(path: string): string {
  // SSRF guard: reject anything that could redirect the fetch off the source origin
  // (protocol-relative //evil.com, traversal, credentials, backslashes, schemes, CR/LF).
  const raw = String(path || "/");
  if (
    /[\\\r\n\t]/.test(raw) ||
    raw.includes("..") ||
    raw.includes("@") ||
    /^[a-z][a-z0-9+.-]*:/i.test(raw.trim()) || // absolute scheme like http:, javascript:
    raw.replace(/^\/+/, "").startsWith("/") // protocol-relative // after leading slashes
  ) {
    return "/";
  }
  const cleaned = raw.startsWith("/") ? raw : `/${raw}`;
  return cleaned.replace(/\/+$/, "") || "/";
}

function toAbsoluteUrl(path: string): string {
  if (path === "/") return SOURCE_SITE_URL;
  // Resolve against the source base and assert the origin never changed.
  const base = new URL(SOURCE_SITE_URL);
  const resolved = new URL(path, base);
  if (resolved.origin !== base.origin) {
    return SOURCE_SITE_URL;
  }
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
    const val = $(el).attr("href");
    if (!val) return;
    if (val.startsWith(SOURCE_SITE_URL)) {
      $(el).attr("href", val.replace(SOURCE_SITE_URL, ""));
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

  // Final security pass: allow-list sanitize the transformed markup.
  return sanitizeClonedHtml($.html());
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

// Read a response body as text but abort if it exceeds `maxBytes`, so a malicious or
// runaway upstream cannot exhaust server memory. Handles chunked responses (no
// reliable Content-Length) by streaming.
async function readBodyCapped(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Source response exceeded the maximum allowed size.");
      }
      chunks.push(value);
    }
  }
  return new TextDecoder("utf-8").decode(concatUint8(chunks, total));
}

function concatUint8(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
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

  // SSRF defense-in-depth: redirects are followed, but if they leave the trusted
  // source origin (e.g. a compromised source 302-ing to an internal/metadata host)
  // we refuse to read the body.
  try {
    if (response.url && new URL(response.url).origin !== new URL(SOURCE_SITE_URL).origin) {
      throw new Error("Cross-origin redirect blocked.");
    }
  } catch {
    throw new Error("Source response failed origin validation.");
  }

  const html = await readBodyCapped(response, 8 * 1024 * 1024); // cap at 8 MB to bound memory
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
