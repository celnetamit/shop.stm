type ChatLink = { label: string; href: string };
import { getJournalCatalog } from "@/lib/journal-catalog";

const WEBSITE_CONTEXT = [
  "Primary pages: /, /catalogues-list, /cart, /checkout, /get-proforma-invoice-quote, /account, /for-librarians, /for-agencies, /contact-us, /faq, /policies.",
  "Website focus: journal subscriptions, proforma invoices, institutional and agency purchase flows.",
  "If user asks process, provide short step-by-step guidance.",
  "If relevant, include internal links from this website only.",
  "Act as a helpful sales + support assistant for STM Journals.",
  "If user asks for journal lists by topic, suggest matching journals and direct them to catalogue pages."
].join("\n");

let catalogCache:
  | Array<{
      journalName: string;
      subject: string;
      slug: string;
      issn: string | null;
    }>
  | null = null;

async function getCatalogLite() {
  if (catalogCache) return catalogCache;
  const full = await getJournalCatalog();
  catalogCache = full.map((j) => ({
    journalName: j.journalName,
    subject: j.subject,
    slug: j.slug,
    issn: j.issn
  }));
  return catalogCache;
}

async function buildCatalogContext(userMessage: string): Promise<string> {
  const q = userMessage.toLowerCase().trim();
  if (!q) return "";

  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (words.length === 0) return "";

  try {
    const catalog = await getCatalogLite();
    const scored = catalog
      .map((j) => {
        const text = `${j.journalName} ${j.subject} ${j.issn || ""}`.toLowerCase();
        const score = words.reduce((sum, w) => (text.includes(w) ? sum + 1 : sum), 0);
        return { j, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (scored.length === 0) return "";
    const lines = scored.map(
      (x, idx) =>
        `${idx + 1}. ${x.j.journalName} | Subject: ${x.j.subject} | ISSN: ${x.j.issn || "N/A"} | URL: /product/${x.j.slug}`
    );
    return `Relevant journals from website catalog for this query:\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function generateChatReply(input: {
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

  if (!apiKey) {
    return {
      reply: "Assistant is temporarily unavailable. Please contact support at /contact-us.",
      links: [{ label: "Contact Us", href: "/contact-us" }] as ChatLink[],
      intent: null as string | null
    };
  }

  const dynamicCatalogContext = await buildCatalogContext(input.userMessage);

  const messages = [
    {
      role: "system",
      content:
        `You are STM Journals sales + support assistant.\n${WEBSITE_CONTEXT}\n` +
        (dynamicCatalogContext ? `\n${dynamicCatalogContext}\n` : "\n") +
        "Return STRICT JSON only: {\"reply\":\"...\",\"intent\":\"...\",\"links\":[{\"label\":\"...\",\"href\":\"/...\"}]}.\n" +
        "Intent should be one of: Inquiry, Proforma, Order, Support, Pricing, Journals, Agency, Librarian, Checkout.\n" +
        "Keep reply concise and practical. Provide at most 4 links."
    },
    ...input.history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: input.userMessage }
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://shop.stmjournals.in",
      "X-Title": "STM Journals Assistant"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    throw new Error(`OpenRouter request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content?.trim() || "";
  const jsonBlock = extractJson(raw);
  if (!jsonBlock) {
    return {
      reply: raw || "Please visit /contact-us and our team will assist you.",
      links: [{ label: "Contact Us", href: "/contact-us" }] as ChatLink[],
      intent: null as string | null
    };
  }

  try {
    const parsed = JSON.parse(jsonBlock) as {
      reply?: string;
      intent?: string;
      links?: ChatLink[];
    };
    const safeLinks = (parsed.links || []).filter((l) => l?.href?.startsWith("/")).slice(0, 4);
    return {
      reply: parsed.reply || "Please share more details so I can help.",
      links: safeLinks,
      intent: parsed.intent || null
    };
  } catch {
    return {
      reply: raw || "Please visit /contact-us and our team will assist you.",
      links: [{ label: "Contact Us", href: "/contact-us" }] as ChatLink[],
      intent: null as string | null
    };
  }
}

export function extractLeadData(message: string): {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
} {
  const out: { name?: string; email?: string; phone?: string; organization?: string } = {};
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) out.email = email;

  const phone = message.match(/(?:\+?\d[\d\s-]{8,}\d)/)?.[0]?.replace(/\s+/g, " ").trim();
  if (phone) out.phone = phone;

  const name = message.match(/(?:my name is|i am|this is)\s+([a-z][a-z\s]{2,40})/i)?.[1];
  if (name) out.name = name.trim().replace(/\b\w/g, (c) => c.toUpperCase());

  const org = message.match(/(?:from|at|organization is|institution is)\s+([a-z0-9&.,\-\s]{3,60})/i)?.[1];
  if (org) out.organization = org.trim();

  return out;
}
