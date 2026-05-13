import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Frequently Asked Questions | STM Journals",
  description: "Find expert answers to all your subscription, access, technical support, and payment questions at STM Journals.",
};

export default function FaqPage() {
  const faqGroups = [
    {
      category: "General & Subscription Basics",
      items: [
        {
          q: "How can I subscribe to STM Journals?",
          a: "Subscribing is simple: 1. Visit our Journal List to select your titles. 2. Complete the online subscription form. 3. Choose your subscription type (Print, Online, or Print + Online). 4. Complete secure payment via checkout portal or institutional proforma invoice."
        },
        {
          q: "What are the subscription rates?",
          a: "Rates vary by journal and subscription type. We offer competitive global rates in both INR and USD. For a personalized institutional quote or bulk pricing, please email us at subscriptions@stmjournals.com."
        },
        {
          q: "What types of subscriptions are available?",
          a: "We offer three subscription models: Digital-only Online Access, physical Print Editions, and a combined Print + Online bundled package."
        },
        {
          q: "Do you offer trial subscriptions?",
          a: "Yes, we provide complimentary 30-day institutional trial access upon validation. Contact our sales desk with your institution's IP ranges to activate the trial."
        },
        {
          q: "Can I subscribe mid-year?",
          a: "Yes. Subscriptions can be initiated at any point. Pro-rata pricing may apply depending on the exact activation month and physical back-issue availability."
        }
      ]
    },
    {
      category: "Access & Technical Support",
      items: [
        {
          q: "Can I access journals online?",
          a: "Yes. Individual subscribers receive specialized user credentials. Institutional access is validated via Campus-wide IP Authentication, granting all on-network users instant access without needing individual credentials."
        },
        {
          q: "I am having trouble accessing journals. What should I do?",
          a: "Ensure you are logged in or verified via your institutional network IP range. Try clearing your browser cookies and cache. If issues persist, contact our 24/7 technical queue at info@stmjournals.com."
        },
        {
          q: "How do I claim a missing online article?",
          a: "If an article is missing from the database, email info@stmjournals.com with the exact Title, Volume, and Issue number. Technical resolution is guaranteed within 5 working days."
        },
        {
          q: "Can I access journals offline?",
          a: "No, our electronic database is hosted securely on dynamic cloud servers, ensuring that content is served live with immediate real-time indexing."
        },
        {
          q: "How do I reset my password?",
          a: "Click the 'Login' icon at the top right, select 'Forgot Password', and enter your registered email. A secure reset link will be dispatched immediately."
        }
      ]
    },
    {
      category: "Claims & Shipping",
      items: [
        {
          q: "What should I do if I miss a printed issue?",
          a: "Claims for non-receipt of physical copies must be logged within 30 days of standard publication schedules by emailing subscriptions@stmjournals.com."
        },
        {
          q: "Are all missing issues eligible for replacement?",
          a: "Yes. We replace copies lost in transit, transit-damaged products, or manufacturing defect items, subject entirely to immediate inventory availability."
        },
        {
          q: "How are printed copies delivered?",
          a: "Physical issues are packaged in rigid cardboard flat mailers and sent via Registered Post or Express Courier. Logistics rates are bundled within the standard subscription price."
        }
      ]
    },
    {
      category: "Librarian & Consortia Services",
      items: [
        {
          q: "How can librarians manage subscriptions?",
          a: "Librarians are provided with an administrator dash supporting COUNTER-compliant usage reporting, MARC record catalogues for OPAC integrations, and local resource awareness toolkits."
        },
        {
          q: "Are there any discounts for bulk or consortia subscriptions?",
          a: "Yes, we offer bespoke discounts for Consortia groups, multi-site network clusters, and bulk multi-discipline collections. Email info@stmjournals.com for volume quotes."
        },
        {
          q: "Can we customize the list of journals in our package?",
          a: "Yes. Libraries have full autonomy to select our Complete Collection, predefined thematic packages, or build their own bespoke Pick-and-Choose customized list."
        }
      ]
    },
    {
      category: "Renewals, Discounts & Payments",
      items: [
        {
          q: "Do you offer early renewal discounts?",
          a: "Yes, discounted pricing windows are extended to all libraries and individuals who submit their renewal commitments prior to current subscription expirations."
        },
        {
          q: "Are there discounts for multiple journal subscriptions?",
          a: "Multi-journal discounts are available for unified institutional ordering. Select 'Get Proforma/Quote' to review potential bundled cost reductions."
        },
        {
          q: "Do you have a referral program?",
          a: "Yes. Recommending peer institutions to STM Journals can yield a 10% administrative credit redeemable against your next academic renewal cycle."
        },
        {
          q: "What payment methods do you accept?",
          a: "We support secure Credit/Debit processing, Domestic UPI, Net Banking, and Direct Swift/Wire transfers (NEFT/RTGS). Official bank drafts or corporate cheques are also supported."
        },
        {
          q: "What are your customer support hours?",
          a: "Direct specialist support is available Mon-Sat, 9:00 AM – 6:00 PM IST. Contact us directly at info@stmjournals.com or +91-9810078958."
        }
      ]
    },
    {
      category: "Policies & Terms",
      items: [
        {
          q: "Can I cancel my subscription?",
          a: "Cancelation and refund requests are honored within 7 calendar days of initial enrollment. Post 7 days, cancellations can be set to not renew, but current access will persist."
        },
        {
          q: "Do you offer Open Access options?",
          a: "We are dedicated advocates of Open Access. We publish Open Access titles and operate hybrid journals with robust pathways for authors to publish under CC BY protocols."
        },
        {
          q: "What is the standard subscription period?",
          a: "The typical physical and online subscription window operates on a fixed calendar year cycle spanning January 1st through December 31st."
        }
      ]
    }
  ];

  // Map all flat items to Schema.org output for premium SEO rich snippet results
  const flatFaqs = faqGroups.flatMap(group => group.items);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": flatFaqs.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <main className="faq-page" style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      {/* Inject JSON-LD schema for SEO Search Result Rich Accordions */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div style={{ textAlign: "center", marginBottom: "45px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", color: "#0F172A", marginBottom: "10px" }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: "#64748B", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
          Find expert answers to all your subscription queries, technical access requirements, claims processing, and payment support needs.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {faqGroups.map((group, idx) => (
          <section key={idx}>
            <h2 style={{ 
              fontSize: "20px", 
              fontWeight: "700", 
              color: "#3B82F6", 
              textTransform: "uppercase", 
              letterSpacing: "0.5px", 
              marginBottom: "16px",
              borderBottom: "2px solid #EFF6FF",
              paddingBottom: "8px"
            }}>
              {group.category}
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {group.items.map((item, i) => (
                <details 
                  key={i} 
                  style={{ 
                    background: "#FFFFFF", 
                    border: "1px solid #E2E8F0", 
                    borderRadius: "10px", 
                    padding: "18px", 
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                  }}
                  className="faq-item"
                >
                  <summary style={{ 
                    fontWeight: "600", 
                    fontSize: "17px", 
                    color: "#0F172A", 
                    outline: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    userSelect: "none"
                  }}>
                    <span>{item.q}</span>
                    <span style={{ color: "#94A3B8", transition: "transform 0.2s ease" }}>▼</span>
                  </summary>
                  <div style={{ 
                    marginTop: "14px", 
                    color: "#475569", 
                    lineHeight: 1.65, 
                    cursor: "default",
                    fontSize: "15px",
                    paddingTop: "14px",
                    borderTop: "1px solid #F1F5F9"
                  }}>
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={{ 
        border: "1px solid #E2E8F0", 
        borderRadius: "12px", 
        padding: "28px", 
        background: "#F8FAFC", 
        marginTop: "50px",
        textAlign: "center"
      }}>
        <h3 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "8px", fontWeight: "700" }}>
          Still have questions?
        </h3>
        <p style={{ color: "#475569", marginBottom: "20px", fontSize: "15px" }}>
          Our dedicated support specialists are available Monday to Saturday, 9 AM – 6 PM IST to assist you.
        </p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:subscriptions@stmjournals.com" style={{ 
            background: "#2563EB", 
            color: "#FFFFFF", 
            textDecoration: "none", 
            padding: "12px 24px", 
            borderRadius: "8px", 
            fontWeight: "600",
            fontSize: "15px",
            transition: "background 0.2s ease"
          }}>
            Email Support
          </a>
          <a href="tel:+919810078958" style={{ 
            border: "1px solid #CBD5E1", 
            color: "#334155", 
            textDecoration: "none", 
            padding: "12px 24px", 
            borderRadius: "8px", 
            fontWeight: "600",
            fontSize: "15px",
            background: "#FFFFFF"
          }}>
            Call +91-9810078958
          </a>
        </div>
      </div>
    </main>
  );
}
