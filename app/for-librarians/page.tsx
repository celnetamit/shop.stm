import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Librarian Resources & Tools | STM Journals",
  description: "Tools and support for librarians and information professionals to manage journal subscriptions, IP authentication, MARC records, and discovery integrations.",
};

export default function ForLibrariansPage() {
  const coreTools = [
    {
      title: "Access & Authentication 🌐",
      points: [
        "Instant IP Authentication (IPV4, proxy configurations)",
        "Remote access via EZproxy, Athens, and Shibboleth",
        "Secure administrator dashboards to manage endpoints",
        "Department-specific user credentials for unique silos"
      ]
    },
    {
      title: "Discovery & Integration 🧩",
      points: [
        "Downloadable high-quality MARC Records by subject category",
        "Seamless API integrations with EBSCO and OCLC",
        "Fully compatible with Ex Libris Primo and major OPAC platforms",
        "Automated index feed synchronization"
      ]
    },
    {
      title: "Consortia & Volume Pricing 💰",
      points: [
        "Highly tiered packages for multi-university networks",
        "Lock-in pricing protection with 2-year & 3-year contracts",
        "Generous discounts for E-only digital-only licenses",
        "Flexible Pick-and-Choose custom title bundling"
      ]
    },
    {
      title: "Usage & Engagement Toolkits 📈",
      points: [
        "Standardized COUNTER-compliant usage reporting",
        "Complimentary patron awareness marketing materials",
        "Social media templates and downloadable library banners",
        "On-demand user guides and research video tutorials"
      ]
    }
  ];

  return (
    <main className="librarians-page" style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "45px" }}>
        <span style={{
          background: "rgba(16, 185, 129, 0.15)",
          color: "#10B981",
          fontSize: "12px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "6px 14px",
          borderRadius: "9999px",
          display: "inline-block",
          marginBottom: "16px",
        }}>
          Institutional Subscriptions
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", color: "var(--text)", marginBottom: "12px" }}>
          Librarian & Institutional Resources
        </h1>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: "1.7", maxWidth: "700px", margin: "0 auto" }}>
          We support information professionals in serving their academic user bases. Seamlessly acquire, authenticate, and catalog world-class research publications with maximum efficiency.
        </p>
      </div>

      {/* Resource Cards Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "24px", marginBottom: "50px" }}>
        {coreTools.map((tool, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "12px", padding: "28px", background: "var(--surface)" }}>
            <h3 style={{ fontSize: "20px", color: "var(--text)", fontWeight: "700", marginTop: 0, marginBottom: "16px" }}>
              {tool.title}
            </h3>
            <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {tool.points.map((point, pIdx) => (
                <li key={pIdx} style={{ color: "var(--muted)", lineHeight: 1.5, fontSize: "15px" }}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Interactive Library Tools Section */}
      <section style={{ 
        background: "var(--surface-soft)", 
        border: "1px solid var(--line)", 
        borderRadius: "12px", 
        padding: "35px", 
        marginBottom: "50px",
        textAlign: "center"
      }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "var(--text)", marginBottom: "12px", fontWeight: "700" }}>
          Acquisition Tooling & Catalogues
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "28px", maxWidth: "500px", margin: "0 auto 24px auto" }}>
          Instantly download our price sheets, request dynamic institutional proforma quotes, or recommend titles to your central library committee.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/catalogues-list" style={{
            background: "var(--text)",
            color: "var(--surface)",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            textDecoration: "none",
          }}>
            📑 Download Catalogue (PDF)
          </a>
          <a href="/get-proforma-invoice-quote" style={{
            background: "var(--brand)",
            color: "#FFFFFF",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            textDecoration: "none",
          }}>
            ✍️ Generate Proforma Quote
          </a>
        </div>
      </section>

      {/* Open Access Integration Footer */}
      <section style={{
        border: "1px solid var(--line)",
        borderRadius: "10px",
        padding: "24px",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <h3 style={{ fontSize: "18px", color: "var(--text)", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          🔓 Dedicated Open Access Partnerships
        </h3>
        <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          We champion hybrid journal frameworks and standard read-and-publish institutional licensing models. Librarians can streamline transformative agreements that grant global publishing capabilities to local university authors under CC BY provisions.
        </p>
      </section>

      {/* Instant Librarian Help Desk */}
      <div style={{ 
        border: "1px solid var(--line)", 
        borderRadius: "12px", 
        padding: "28px", 
        background: "var(--surface-soft)", 
        marginTop: "50px",
        textAlign: "center"
      }}>
        <h3 style={{ fontSize: "20px", color: "var(--text)", marginTop: 0, marginBottom: "8px", fontWeight: "700" }}>
          Dedicated Librarian Assistance Queue
        </h3>
        <p style={{ color: "var(--muted)", marginBottom: "20px", fontSize: "15px" }}>
          For technical IP setups, missing physical issue claims, or custom bundle quotations, email us directly.
        </p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:info@stmjournals.com" style={{ 
            background: "var(--brand)", 
            color: "#FFFFFF", 
            textDecoration: "none", 
            padding: "12px 24px", 
            borderRadius: "8px", 
            fontWeight: "600",
            fontSize: "15px"
          }}>
            Email Consortia Relations
          </a>
          <a href="tel:+919810078958" style={{ 
            border: "1px solid var(--line)", 
            color: "var(--text)", 
            textDecoration: "none", 
            padding: "12px 24px", 
            borderRadius: "8px", 
            fontWeight: "600",
            fontSize: "15px",
            background: "var(--surface)"
          }}>
            Call +91-9810078958
          </a>
        </div>
      </div>
    </main>
  );
}
