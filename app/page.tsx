import Link from "next/link";
import { getDomainCountsFromCsv, getJournalCatalog } from "@/lib/journal-catalog";
import HomeSections from "@/app/components/home-sections";
import ScrollReveal from "@/app/components/scroll-reveal";
import WaterRipples from "@/app/components/water-ripples";
import InteractiveBookshelf from "@/app/components/interactive-bookshelf";
import HomeContactQueries from "@/app/components/home-contact-queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [domains, allJournals] = await Promise.all([getDomainCountsFromCsv(), getJournalCatalog()]);
  const trending = [...allJournals].sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <>
      {/* 1 & 2. Elegant Hero Banner & Connecting 120+ Countries Pill */}
      <section className="home-v3-hero" style={{
        background: "#050505",
        position: "relative",
        overflow: "hidden",
        border: "none",
        borderRadius: "0",
        gridTemplateColumns: "1fr",
        padding: "80px 20px 0px",
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "inset 0 -1px 0 rgba(255, 255, 255, 0.08)",
        transition: "background 0.3s"
      }}>
        {/* Animated blurred/darkened canvas container for ripples and background image */}
        <div className="home-v3-hero-bg-canvas" style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "var(--hero-bg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(4px) brightness(0.55)", // Cinematic soft-focus blur (preserves refraction details) & rich dark control
          transform: "scale(1.04)", // Prevent border edge bleeding from CSS filter blur
          zIndex: -2, // Sits perfectly behind the dynamic glowing orbs
          pointerEvents: "none"
        }} />

        {/* Client-side high-fidelity WebGL dynamic water ripple effects */}
        <WaterRipples />

        {/* Animated premium visual effects background layers */}
        <div className="hero-glow-orb orb-1" />
        <div className="hero-glow-orb orb-2" />
        <div className="hero-glow-orb orb-3" />
        <div className="hero-grid-pattern" />

        <div className="home-v3-hero-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "840px", margin: "0 auto", position: "relative", zIndex: "2" }}>
          <div className="transition-smooth" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "#F59E0B",
            borderRadius: "9999px",
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.03em",
            marginBottom: "24px",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)"
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
          <p className="home-v3-kicker" style={{ color: "#F59E0B", fontFamily: "Outfit, sans-serif", fontSize: "14px", letterSpacing: "0.12em", marginBottom: "12px", textTransform: "uppercase", fontWeight: "700" }}>Scholarly Publishing Marketplace</p>
          <h1 className="hero-glowing-title" style={{ fontFamily: "'Playfair Display', serif", fontWeight: "800", fontSize: "clamp(34px, 5.5vw, 56px)", lineHeight: "1.12", letterSpacing: "-0.01em" }}>Discover World-Class Research & Innovation</h1>
          <p style={{ color: "rgba(226, 232, 240, 0.85)", fontSize: "17.5px", lineHeight: "1.65", fontFamily: "Outfit, sans-serif", margin: "16px 0 32px", maxWidth: "700px" }}>
            Access 274+ peer-reviewed journals. Stay ahead with the latest developments in Science, Technology, and Medicine. Request fast institutional proforma support in one modern workflow.
          </p>
          <div className="home-v3-hero-actions" style={{ justifyContent: "center", gap: "16px" }}>
            <Link href="/catalogues-list" className="btn-shimmer" style={{ background: "#F59E0B", color: "#0F172A", borderColor: "#F59E0B", padding: "12px 28px", fontSize: "14.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>Explore Catalogues</Link>
            <Link href="/get-proforma-invoice-quote" className="btn-glow-outline" style={{ color: "#ffffff", padding: "12px 28px", fontSize: "14.5px" }}>Request Proforma Quote</Link>
          </div>
        </div>

        {/* Dynamic interactive scholastic bookshelf */}
        <InteractiveBookshelf />
      </section>

      <main className="home-page-v3" style={{ paddingTop: "0" }}>
        {/* 3. Core Trust Indicators Pill Banner Underneath Hero */}
        <ScrollReveal>
          <div className="trust-pill-banner" style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-md)",
            padding: "20px 24px",
            margin: "16px 0 40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
            alignItems: "center",
            transition: "background 0.3s, border-color 0.3s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "var(--brand)", background: "var(--accent-glow)", borderColor: "var(--brand)" }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Global Delivery</h4>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>Shipping to 100+ countries</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#16a34a", background: "rgba(22, 163, 74, 0.08)", borderColor: "rgba(22, 163, 74, 0.2)" }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Secure Payment</h4>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>Encrypted transactions</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#eab308", background: "rgba(234, 179, 8, 0.08)", borderColor: "rgba(234, 179, 8, 0.2)" }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>274+ Journals</h4>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>Curated academic collection</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="dotted-circle-badge" style={{ width: "42px", height: "42px", color: "#8b5cf6", background: "rgba(139, 92, 246, 0.08)", borderColor: "rgba(139, 92, 246, 0.2)" }}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: "0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Institutional Access</h4>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>Special rates for libraries</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <HomeSections domains={domains} journals={trending} />

        {/* 4. Why Choose STM Section matching Screenshot 1 */}
        <ScrollReveal>
          <section className="why-choose-stm" style={{
            marginTop: "50px",
            background: "var(--surface-soft)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "40px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            transition: "background 0.3s, border-color 0.3s"
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "28px",
              color: "var(--text)",
              marginBottom: "10px",
              fontWeight: "700"
            }}>Why Choose STM Journals?</h2>
            <p style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "14px",
              color: "var(--muted)",
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
                  border: "1.5px dotted var(--brand)",
                  background: "var(--surface)",
                  marginBottom: "15px",
                  color: "var(--brand)"
                }}>
                  <svg style={{ width: "26px", height: "26px", color: "var(--brand)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text)", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Trustworthy</h3>
                <p style={{ margin: "0", fontSize: "13px", color: "var(--muted)", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
                  Commitment of Quality Books with Accurate Content from India&apos;s Best Educators
                </p>
              </div>

              {/* Column 2 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="dotted-circle-badge" style={{
                  width: "65px",
                  height: "65px",
                  border: "1.5px dotted var(--brand)",
                  background: "var(--surface)",
                  marginBottom: "15px",
                  color: "var(--brand)"
                }}>
                  <svg style={{ width: "26px", height: "26px", color: "var(--brand)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text)", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Exhaustive</h3>
                <p style={{ margin: "0", fontSize: "13px", color: "var(--muted)", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
                  360° Solution to All Learning Needs (Textbooks, Guides, Samples, Solved Papers)
                </p>
              </div>

              {/* Column 3 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="dotted-circle-badge" style={{
                  width: "65px",
                  height: "65px",
                  border: "1.5px dotted var(--brand)",
                  background: "var(--surface)",
                  marginBottom: "15px",
                  color: "var(--brand)"
                }}>
                  <svg style={{ width: "26px", height: "26px", color: "var(--brand)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text)", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Innovative</h3>
                <p style={{ margin: "0", fontSize: "13px", color: "var(--muted)", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
                  New Prep Strategies and Presentation Styles to Make Exam Preparation Easy
                </p>
              </div>

              {/* Column 4 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="dotted-circle-badge" style={{
                  width: "65px",
                  height: "65px",
                  border: "1.5px dotted var(--brand)",
                  background: "var(--surface)",
                  marginBottom: "15px",
                  color: "var(--brand)"
                }}>
                  <svg style={{ width: "26px", height: "26px", color: "var(--brand)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text)", textTransform: "uppercase", fontFamily: "Outfit, sans-serif" }}>Relevant</h3>
                <p style={{ margin: "0", fontSize: "13px", color: "var(--muted)", lineHeight: "1.5", maxWidth: "220px", fontFamily: "Outfit, sans-serif" }}>
                  Thoroughly Revised & Updated Content to Match Exam Pattern & Trend
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <HomeContactQueries />
      </main>
    </>
  );
}
