"use client";

import { useMemo, useState } from "react";

type HelpLink = { label: string; href: string };
type Knowledge = {
  id: string;
  keywords: string[];
  answer: string;
  links: HelpLink[];
  steps?: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  links?: HelpLink[];
  steps?: string[];
};

const KNOWLEDGE_BASE: Knowledge[] = [
  {
    id: "proforma",
    keywords: ["proforma", "quote", "pi", "invoice quote", "institutional"],
    answer: "You can create a Proforma/PI quote from the Proforma page and then download or share it.",
    links: [
      { label: "Create Proforma Quote", href: "/get-proforma-invoice-quote" },
      { label: "Your Account Dashboard", href: "/account" }
    ],
    steps: [
      "Open the Proforma page and fill subscriber details.",
      "Select journals and plans (Print/Online/Print+Online).",
      "Review totals and submit the quote.",
      "Download/print from your account Proforma tab."
    ]
  },
  {
    id: "orders",
    keywords: ["order", "checkout", "payment", "invoice", "paid", "cart"],
    answer: "For purchases, add journals to cart, complete checkout, and download invoice from your dashboard.",
    links: [
      { label: "Browse Catalogues", href: "/catalogues-list" },
      { label: "Cart", href: "/cart" },
      { label: "Account Orders", href: "/account" }
    ],
    steps: [
      "Add required journals/products to cart.",
      "Proceed to checkout and complete payment.",
      "Open account dashboard and go to Orders tab.",
      "Click invoice download/view action for that order."
    ]
  },
  {
    id: "register",
    keywords: ["register", "signup", "create account", "sign up", "new account"],
    answer: "Create your account from the Register page, then log in to manage quotes, orders and invoices.",
    links: [
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" }
    ],
    steps: [
      "Open Register page.",
      "Enter name, email, password and role.",
      "Submit registration and then log in."
    ]
  },
  {
    id: "librarian",
    keywords: ["librarian", "library", "institution", "campus", "subscription"],
    answer: "Library/institutional subscriptions and support information are available in the Librarians section.",
    links: [
      { label: "For Librarians", href: "/for-librarians" },
      { label: "Catalogues", href: "/catalogues-list" }
    ]
  },
  {
    id: "agency",
    keywords: ["agency", "partner", "distributor", "reseller"],
    answer: "Agency collaboration details and query form are available in the Agencies section.",
    links: [
      { label: "For Agencies", href: "/for-agencies" }
    ],
    steps: [
      "Open For Agencies page.",
      "Fill agency details and requirement message.",
      "Submit form and wait for team response."
    ]
  },
  {
    id: "contact",
    keywords: ["contact", "support", "help", "issue", "problem", "assist"],
    answer: "You can raise any website, order, or subscription issue using the contact form.",
    links: [
      { label: "Contact Us", href: "/contact-us" },
      { label: "FAQ", href: "/faq" }
    ]
  },
  {
    id: "catalogues",
    keywords: ["catalogue", "catalog", "journal list", "browse", "discipline", "subject"],
    answer: "Use the catalogue and subject pages to browse journals by discipline and pricing.",
    links: [
      { label: "Catalogues List", href: "/catalogues-list" },
      { label: "Books", href: "/books" }
    ]
  },
  {
    id: "policies",
    keywords: ["policy", "privacy", "terms", "shipping", "refund", "delivery"],
    answer: "Policies and terms are available in the policy pages below.",
    links: [
      { label: "Policies", href: "/policies" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Shipping & Delivery", href: "/shipping-delivery-policy" }
    ]
  }
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function buildResponse(query: string): Omit<ChatMessage, "id" | "role"> {
  const q = normalize(query);
  const wantsSteps = /\b(how|steps|step|process|guide|procedure)\b/.test(q);

  let best: Knowledge | null = null;
  let bestScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    const score = item.keywords.reduce((sum, kw) => (q.includes(kw) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }

  if (!best || bestScore === 0) {
    return {
      text: "I can help with STM website flows like registration, proforma, checkout, invoice, agencies, and support. Please ask in one line and I will give links and steps.",
      links: [
        { label: "Home", href: "/" },
        { label: "Catalogues", href: "/catalogues-list" },
        { label: "Proforma", href: "/get-proforma-invoice-quote" },
        { label: "Contact", href: "/contact-us" }
      ]
    };
  }

  return {
    text: best.answer,
    links: best.links,
    steps: wantsSteps ? best.steps : undefined
  };
}

export default function PublicChatbot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I am STM Assistant. Ask me about any website process and I will share exact page links and steps."
    }
  ]);

  const quickPrompts = useMemo(
    () => ["How to create proforma?", "How to download invoice?", "How to register?", "Agency process"],
    []
  );

  function send(input?: string) {
    const finalQuery = (input ?? query).trim();
    if (!finalQuery) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: finalQuery };
    const bot = buildResponse(finalQuery);
    const botMsg: ChatMessage = { id: `b-${Date.now()}-${Math.random()}`, role: "bot", ...bot };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setQuery("");
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .chatbot-fab {
          animation: chatbotFloat 2.6s ease-in-out infinite;
        }

        .chatbot-fab::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 999px;
          border: 2px solid rgba(59, 130, 246, 0.45);
          animation: chatbotPulse 2.2s ease-out infinite;
          pointer-events: none;
        }

        .chatbot-fab:hover {
          transform: translateY(-2px) scale(1.05);
        }

        @keyframes chatbotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes chatbotPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1.18); opacity: 0; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      ` }} />

      {open && (
        <div
          className="public-chatbot-root"
          style={{
            position: "fixed",
            right: "20px",
            bottom: "92px",
            width: "min(360px, calc(100vw - 24px))",
            height: "500px",
            background: "#fff",
            border: "1px solid #dbe3f1",
            borderRadius: "14px",
            boxShadow: "0 20px 40px rgba(2, 12, 27, 0.18)",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #e5ebf5", background: "#0f2a57", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "14px" }}>STM Assistant</strong>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }} aria-label="Close assistant">x</button>
          </div>

          <div style={{ padding: "10px", display: "flex", gap: "6px", flexWrap: "wrap", borderBottom: "1px solid #eef2f8" }}>
            {quickPrompts.map((p) => (
              <button key={p} onClick={() => send(p)} style={{ border: "1px solid #cfe0ff", background: "#f3f7ff", color: "#1f4ea1", borderRadius: "999px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                {p}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px", background: "#f8fbff" }}>
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: "10px", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "88%", background: m.role === "user" ? "#1d4ed8" : "#ffffff", color: m.role === "user" ? "#fff" : "#1e293b", border: m.role === "user" ? "none" : "1px solid #dbe5f4", borderRadius: "10px", padding: "9px 10px", fontSize: "12px", lineHeight: 1.45 }}>
                  <div>{m.text}</div>
                  {m.steps && m.steps.length > 0 && (
                    <ol style={{ margin: "8px 0 0 16px", padding: 0 }}>
                      {m.steps.map((s, idx) => (
                        <li key={`${m.id}-s-${idx}`} style={{ marginBottom: "4px" }}>{s}</li>
                      ))}
                    </ol>
                  )}
                  {m.links && m.links.length > 0 && (
                    <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {m.links.map((l) => (
                        <a key={`${m.id}-${l.href}`} href={l.href} style={{ textDecoration: "none", fontWeight: 700, fontSize: "11px", color: m.role === "user" ? "#dbeafe" : "#1d4ed8" }}>
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", padding: "10px", borderTop: "1px solid #e7edf6", background: "#fff" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Ask about process, page, invoice, PI..."
              style={{ flex: 1, border: "1px solid #cdd8ea", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", outline: "none" }}
            />
            <button onClick={() => send()} style={{ border: "none", borderRadius: "8px", background: "#1d4ed8", color: "#fff", padding: "8px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open website assistant"
        title="Ask STM Assistant"
        className="chatbot-fab public-chatbot-root"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
          color: "#fff",
          boxShadow: "0 10px 20px rgba(15, 23, 42, 0.25)",
          fontSize: "22px",
          cursor: "pointer",
          zIndex: 9999
        }}
      >
        💬
      </button>
    </>
  );
}
