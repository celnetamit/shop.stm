import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ)",
  description: "Answers to common questions about journal subscriptions, payments, and editorial processes."
};

export default function FaqPage() {
  const faqs = [
    {
      q: "How do I subscribe to a journal?",
      a: "Browse our catalogue, add the desired subscription type (Print, Online, or Combined) to your cart, and checkout. Alternatively, use 'Get Proforma' for institutional billing."
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept major credit/debit cards, net banking, and institutional offline wire transfer via the proforma quote system."
    },
    {
      q: "How do I access my online subscription?",
      a: "Once payment is processed, users bound to an institutional IP range gain instant access, or login credentials will be dispatched to the nominated email."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <main className="faq-page" style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", color: "#0F172A", textAlign: "center", marginBottom: "40px" }}>
        Frequently Asked Questions
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {faqs.map((item, i) => (
          <details key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px", cursor: "pointer" }} open={i === 0}>
            <summary style={{ fontWeight: "700", fontSize: "18px", color: "#0F172A", outline: "none" }}>{item.q}</summary>
            <div style={{ marginTop: "12px", color: "#475569", lineHeight: 1.6, cursor: "default" }}>
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
