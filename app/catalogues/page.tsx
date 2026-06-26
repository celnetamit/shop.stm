import Link from "next/link";
import type { CSSProperties } from "react";
import { getCataloguesData } from "@/lib/catalogues-data";

export default async function CataloguesMirrorPage() {
  const { masterLinks, collections } = await getCataloguesData();
  const totalJournals = collections.reduce((sum, item) => sum + item.count, 0);

  return (
    <main style={pageWrap}>
      <section style={heroSection}>
        <div style={heroImageLayer} />
        <div style={heroOverlay} />
        <div style={heroContent}>
          <p style={kicker}>STM Journals Resource Center</p>
          <h1 style={heroTitle}>Department Catalogues for Institutional Subscription Planning</h1>
          <p style={heroText}>
            Browse discipline-wise journal portfolios, compare master lists, and move from catalogue review to price-list planning without digging through a crowded page.
          </p>
          <div style={heroActions}>
            <Link href="/catalogues-list?currency=INR" style={primaryBtn}>View INR Price List</Link>
            <Link href="/catalogues-list?currency=USD" style={secondaryBtnLight}>View USD Price List</Link>
            <a href={masterLinks.sheet} target="_blank" rel="noreferrer" style={secondaryBtnLight}>Download Master Sheet</a>
          </div>
        </div>
        <div style={heroStats}>
          <div style={statCard}><strong>{collections.length}</strong><span>Departments</span></div>
          <div style={statCard}><strong>{totalJournals}</strong><span>Listed journals</span></div>
          <div style={statCard}><strong>2026</strong><span>Subscription year</span></div>
        </div>
      </section>

      <section style={resourceGrid}>
        <article style={resourceCard}>
          <span style={resourceLabel}>STM Journals</span>
          <h2 style={resourceTitle}>Complete STM Master Catalogue</h2>
          <p style={resourceText}>Full journal list with subscription planning details for institutional review.</p>
          <a href={masterLinks.fullCatalogPdf} target="_blank" rel="noreferrer" style={downloadBtn}>Download STM PDF</a>
        </article>
        <article style={resourceCard}>
          <span style={resourceLabel}>JournalsPub</span>
          <h2 style={resourceTitle}>JournalsPub Subscription Catalogue</h2>
          <p style={resourceText}>Dedicated JournalsPub catalogue for collections managed under the partner imprint.</p>
          <a href={masterLinks.journalsPubPdf} target="_blank" rel="noreferrer" style={downloadBtn}>Download JournalsPub PDF</a>
        </article>
        <article style={resourceCardStrong}>
          <span style={{ ...resourceLabel, color: "#bfdbfe" }}>Planning Tool</span>
          <h2 style={{ ...resourceTitle, color: "#fff" }}>Need item-level pricing?</h2>
          <p style={{ ...resourceText, color: "#dbeafe" }}>Open the searchable catalogue list for filtering, currency switching, and PDF export.</p>
          <Link href="/catalogues-list" style={downloadBtnLight}>Open Searchable List</Link>
        </article>
      </section>

      <section style={collectionSection}>
        <div style={sectionHead}>
          <div>
            <p style={kickerDark}>Department Wise Collections</p>
            <h2 style={sectionTitle}>Choose a subject area</h2>
          </div>
          <p style={sectionSummary}>Each card links to the live collection page and the master PDF. Image-led cards make the grid easier to scan for librarians and department coordinators.</p>
        </div>
        <div style={collectionsGrid}>
          {collections.map((item) => (
            <article key={item.title} style={domainCard(item.image)}>
              <div style={domainShade} />
              <div style={{ ...domainAccent, background: item.accent }} />
              <div style={domainContent}>
                <p style={journalCount}>{item.count} journals</p>
                <h3 style={domainTitle}>{item.title}</h3>
                <p style={domainText}>Peer-reviewed titles with Print, Online, and Print + Online subscription options.</p>
                <div style={domainActions}>
                  <a href={item.pdf} target="_blank" rel="noreferrer" style={cardLightBtn}>PDF</a>
                  <a href={`/product-category/journals/${encodeURIComponent(item.title)}`} style={cardPrimaryBtn}>View Collection</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const pageWrap: CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "28px 18px 46px",
  color: "#102033"
};

const heroSection: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  minHeight: "430px",
  borderRadius: "18px",
  background: "#102033",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "end",
  boxShadow: "0 22px 60px rgba(15, 23, 42, 0.16)"
};

const heroImageLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1800&q=82')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  transform: "scale(1.02)"
};

const heroOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(90deg, rgba(5, 12, 24, 0.96) 0%, rgba(8, 20, 38, 0.86) 48%, rgba(8, 20, 38, 0.72) 100%)"
};

const heroContent: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "760px",
  padding: "clamp(26px, 5vw, 46px)"
};

const kicker: CSSProperties = {
  margin: "0 0 12px",
  color: "#bfdbfe",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 800
};

const heroTitle: CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 1.05,
  letterSpacing: 0,
  maxWidth: "760px"
};

const heroText: CSSProperties = {
  margin: "18px 0 0",
  color: "#dbeafe",
  fontSize: "17px",
  lineHeight: 1.65,
  maxWidth: "660px"
};

const heroActions: CSSProperties = {
  marginTop: "26px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

const heroStats: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1px",
  background: "rgba(255,255,255,0.18)",
  borderTop: "1px solid rgba(255,255,255,0.2)"
};

const statCard: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "20px 24px",
  background: "rgba(15, 23, 42, 0.42)",
  color: "#dbeafe"
};

const resourceGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
  marginTop: "22px"
};

const resourceCard: CSSProperties = {
  border: "1px solid #d9e3f0",
  borderRadius: "14px",
  background: "#fff",
  padding: "24px",
  minHeight: "210px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  boxShadow: "0 12px 34px rgba(15, 23, 42, 0.07)"
};

const resourceCardStrong: CSSProperties = {
  ...resourceCard,
  border: "1px solid #1d4ed8",
  background: "linear-gradient(135deg, #0f2a57, #1d4ed8)"
};

const resourceLabel: CSSProperties = {
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const resourceTitle: CSSProperties = {
  margin: "12px 0 8px",
  color: "#0f2747",
  fontSize: "22px",
  lineHeight: 1.2
};

const resourceText: CSSProperties = {
  margin: 0,
  color: "#60718c",
  fontSize: "14px",
  lineHeight: 1.55,
  flex: 1
};

const collectionSection: CSSProperties = {
  marginTop: "36px"
};

const sectionHead: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "end",
  flexWrap: "wrap",
  marginBottom: "18px"
};

const kickerDark: CSSProperties = {
  ...kicker,
  color: "#2563eb",
  marginBottom: "8px"
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: "#102a52",
  fontSize: "34px",
  lineHeight: 1.1
};

const sectionSummary: CSSProperties = {
  margin: 0,
  color: "#5f7392",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "520px"
};

const collectionsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "18px"
};

function domainCard(image: string): CSSProperties {
  return {
    position: "relative",
    overflow: "hidden",
    minHeight: "285px",
    borderRadius: "16px",
    backgroundImage: `url('${image}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)"
  };
}

const domainShade: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(5, 12, 24, 0.42) 0%, rgba(5, 12, 24, 0.72) 46%, rgba(5, 12, 24, 0.95) 100%)"
};

const domainAccent: CSSProperties = {
  position: "absolute",
  top: 18,
  right: 18,
  width: 42,
  height: 4,
  borderRadius: 99
};

const domainContent: CSSProperties = {
  position: "absolute",
  inset: "auto 0 0 0",
  padding: "22px",
  color: "#fff"
};

const journalCount: CSSProperties = {
  display: "inline-flex",
  margin: "0 0 10px",
  color: "#e0f2fe",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.24)",
  borderRadius: 99,
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

const domainTitle: CSSProperties = {
  margin: 0,
  fontSize: "25px",
  lineHeight: 1.15,
  color: "#fff"
};

const domainText: CSSProperties = {
  margin: "9px 0 16px",
  color: "#dbeafe",
  fontSize: "14px",
  lineHeight: 1.5
};

const domainActions: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const primaryBtn: CSSProperties = {
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 800,
  color: "#0f172a",
  background: "#f8c44f",
  border: "1px solid #f8c44f",
  borderRadius: "10px",
  padding: "12px 16px",
  display: "inline-flex"
};

const secondaryBtnLight: CSSProperties = {
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 800,
  color: "#fff",
  background: "rgba(255,255,255,0.13)",
  border: "1px solid rgba(255,255,255,0.36)",
  borderRadius: "10px",
  padding: "12px 16px",
  display: "inline-flex"
};

const downloadBtn: CSSProperties = {
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
  color: "#fff",
  background: "#1d4ed8",
  borderRadius: "10px",
  padding: "10px 14px",
  display: "inline-flex",
  marginTop: "18px"
};

const downloadBtnLight: CSSProperties = {
  ...downloadBtn,
  color: "#0f2a57",
  background: "#fff"
};

const cardLightBtn: CSSProperties = {
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
  color: "#0f172a",
  background: "#fff",
  border: "1px solid rgba(255,255,255,0.6)",
  borderRadius: "9px",
  padding: "9px 12px",
  display: "inline-flex"
};

const cardPrimaryBtn: CSSProperties = {
  ...cardLightBtn,
  color: "#fff",
  background: "rgba(37, 99, 235, 0.92)",
  border: "1px solid rgba(147, 197, 253, 0.7)"
};
