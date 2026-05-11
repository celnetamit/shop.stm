import { getDomainCountsFromCsv, getJournalCatalog } from "@/lib/journal-catalog";
import HomeSections from "@/app/components/home-sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [domains, allJournals] = await Promise.all([getDomainCountsFromCsv(), getJournalCatalog()]);
  const trending = [...allJournals].sort(() => Math.random() - 0.5).slice(0, 8);
  const domainCount = domains.length;
  const totalJournals = allJournals.length;

  return (
    <>
      {/* 1 & 2. Elegant Hero Banner & Connecting 120+ Countries Pill */}
      <section className="home-v3-hero" style={{
        background: "linear-gradient(135deg, #0a192f 0%, #172554 100%)",
        position: "relative",
        overflow: "hidden",
        border: "none",
        borderRadius: "0",
        gridTemplateColumns: "1fr",
        padding: "80px 20px",
        width: "100%"
      }}>
        <div className="home-v3-hero-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#F59E0B",
            borderRadius: "9999px",
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.03em",
            marginBottom: "20px"
          }}>
            <span className="pulse-indicator" style={{
              width: "6px",
              height: "6px",
              background: "#F59E0B",
              borderRadius: "50%",
              display: "inline-block"
            }} />
            Connecting 120+ Countries
          </div>
          <p className="home-v3-kicker" style={{ color: "#F59E0B", fontFamily: "Outfit, sans-serif" }}>Scholarly Publishing Marketplace</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", color: "#ffffff", fontSize: "clamp(32px, 5vw, 52px)" }}>Discover World-Class Research & Innovation</h1>
          <p style={{ color: "#cbd5e1", fontSize: "17px", lineHeight: "1.6", fontFamily: "Outfit, sans-serif", margin: "10px 0 25px" }}>
            Access 274+ peer-reviewed journals. Stay ahead with the latest developments in Science, Technology, and Medicine. Request fast institutional proforma support in one modern workflow.
          </p>
          <div className="home-v3-hero-actions" style={{ justifyContent: "center" }}>
            <a href="/catalogues-list" style={{ background: "#F59E0B", color: "#0F172A", borderColor: "#F59E0B" }}>Explore Catalogues</a>
            <a href="/get-proforma-invoice-quote">Request Proforma Quote</a>
          </div>
        </div>
      </section>

      <main className="home-page-v3" style={{ paddingTop: "0" }}>
        {/* 3. Core Trust Indicators Pill Banner Underneath Hero */}
      <div className="trust-pill-banner" style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "4px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
        padding: "20px 24px",
        margin: "16px 0 40px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "24px",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#2563eb", background: "#f0f6ff", borderColor: "#bfdbfe" }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "Outfit, sans-serif" }}>Global Delivery</h4>
            <p style={{ margin: "0", fontSize: "12px", color: "#64748b", fontFamily: "Outfit, sans-serif" }}>Shipping to 100+ countries</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#16a34a", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "Outfit, sans-serif" }}>Secure Payment</h4>
            <p style={{ margin: "0", fontSize: "12px", color: "#64748b", fontFamily: "Outfit, sans-serif" }}>Encrypted transactions</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#eab308", background: "#fefce8", borderColor: "#fef08a" }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "Outfit, sans-serif" }}>274+ Journals</h4>
            <p style={{ margin: "0", fontSize: "12px", color: "#64748b", fontFamily: "Outfit, sans-serif" }}>Curated academic collection</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#8b5cf6", background: "#f5f3ff", borderColor: "#ddd6fe" }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "Outfit, sans-serif" }}>Institutional Access</h4>
            <p style={{ margin: "0", fontSize: "12px", color: "#64748b", fontFamily: "Outfit, sans-serif" }}>Special rates for libraries</p>
          </div>
        </div>
      </div>

      <HomeSections domains={domains} journals={trending} />

      {/* 4. Why Choose STM Section matching Screenshot 1 */}
      <section className="why-choose-stm" style={{
        marginTop: "50px",
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: "4px",
        padding: "40px 24px",
        textAlign: "center"
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "28px",
          color: "#0F172A",
          marginBottom: "10px",
          fontWeight: "700"
        }}>Why Choose STM Journals?</h2>
        <p style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "14px",
          color: "#64748b",
          maxWidth: "600px",
          margin: "0 auto 35px",
          lineHeight: "1.6"
        }}>We hold ourselves to the highest benchmarks of academic publishing to deliver incredible reading and research experiences.</p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "30px"
        }}>
          {/* Column 1 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="dotted-circle-badge" style={{
              width: "65px",
              height: "65px",
              border: "1.5px dotted #ef4444",
              background: "#ffffff",
              marginBottom: "15px"
            }}>
              <svg style={{ width: "26px", height: "26px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "#0F172A", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Trustworthy</h3>
            <p style={{ margin: "0", fontSize: "13px", color: "#475569", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
              Commitment of Quality Books with Accurate Content from India's Best Educators
            </p>
          </div>

          {/* Column 2 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="dotted-circle-badge" style={{
              width: "65px",
              height: "65px",
              border: "1.5px dotted #ef4444",
              background: "#ffffff",
              marginBottom: "15px"
            }}>
              <svg style={{ width: "26px", height: "26px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "#0F172A", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Exhaustive</h3>
            <p style={{ margin: "0", fontSize: "13px", color: "#475569", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
              360° Solution to All Learning Needs (Textbooks, Guides, Samples, Solved Papers)
            </p>
          </div>

          {/* Column 3 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="dotted-circle-badge" style={{
              width: "65px",
              height: "65px",
              border: "1.5px dotted #ef4444",
              background: "#ffffff",
              marginBottom: "15px"
            }}>
              <svg style={{ width: "26px", height: "26px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "#0F172A", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Innovative</h3>
            <p style={{ margin: "0", fontSize: "13px", color: "#475569", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
              New Prep Strategies and Presentation Styles to Make Exam Preparation Easy
            </p>
          </div>

          {/* Column 4 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="dotted-circle-badge" style={{
              width: "65px",
              height: "65px",
              border: "1.5px dotted #ef4444",
              background: "#ffffff",
              marginBottom: "15px"
            }}>
              <svg style={{ width: "26px", height: "26px", color: "#ef4444" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "#0F172A", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Relevant</h3>
            <p style={{ margin: "0", fontSize: "13px", color: "#475569", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
              Thoroughly Revised & Updated Content to Match Exam Pattern & Trend
            </p>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
