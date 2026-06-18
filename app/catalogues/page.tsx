import Link from "next/link";
import type { CSSProperties } from "react";

const masterLinks = {
  stmPdf: "https://shop.stmjournals.com/wp-content/uploads/2025/11/ae07f484-stm-journals-subscription-price-list-2026-.pdf",
  journalsPubPdf: "https://storage.googleapis.com/shop-stmjournals-com-wp-media-to-gcp-offload/2025/12/34b35c1a-journalspub-subscription-price-list-2026.pdf",
  sheet: "https://storage.googleapis.com/shop-stmjournals-com-wp-media-to-gcp-offload/2025/12/0dd84432-stm-journals-price-list-for-subscription-year-2026.xlsx"
};

const collections = [
  { title: "Agriculture", count: 6, href: "https://shop.stmjournals.com/product-category/journals/Agriculture/", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80", accent: "#2f7d32" },
  { title: "Applied Mechanics", count: 8, href: "https://shop.stmjournals.com/product-category/journals/Applied%20Mechanics/", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80", accent: "#475569" },
  { title: "Applied Sciences", count: 8, href: "https://shop.stmjournals.com/product-category/journals/Applied%20Sciences/", image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=900&q=80", accent: "#2563eb" },
  { title: "Architecture", count: 10, href: "https://shop.stmjournals.com/product-category/journals/Architecture/", image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=80", accent: "#334155" },
  { title: "Ayurveda", count: 4, href: "https://shop.stmjournals.com/product-category/journals/Ayurveda/", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=900&q=80", accent: "#15803d" },
  { title: "Bio Technology", count: 14, href: "https://shop.stmjournals.com/product-category/journals/Bio%20Technology/", image: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=900&q=80", accent: "#0f766e" },
  { title: "Chemical Engineering", count: 11, href: "https://shop.stmjournals.com/product-category/journals/Chemical%20Engineering/", image: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=900&q=80", accent: "#7c3aed" },
  { title: "Chemistry", count: 14, href: "https://shop.stmjournals.com/product-category/journals/Chemistry/", image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=900&q=80", accent: "#0891b2" },
  { title: "Computer/IT", count: 34, href: "https://shop.stmjournals.com/product-category/journals/Computer/IT/", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80", accent: "#1d4ed8" },
  { title: "Education and Social Sciences", count: 7, href: "https://shop.stmjournals.com/product-category/journals/Education%20and%20Social%20Sciences/", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80", accent: "#9333ea" },
  { title: "Energy", count: 5, href: "https://shop.stmjournals.com/product-category/journals/Energy/", image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80", accent: "#ca8a04" },
  { title: "Law", count: 15, href: "https://shop.stmjournals.com/product-category/journals/Law/", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80", accent: "#92400e" },
  { title: "Management", count: 16, href: "https://shop.stmjournals.com/product-category/journals/Management/", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80", accent: "#0f766e" },
  { title: "Medical Sciences", count: 25, href: "https://shop.stmjournals.com/product-category/journals/Medical%20Sciences/", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80", accent: "#dc2626" },
  { title: "Nano Technology", count: 6, href: "https://shop.stmjournals.com/product-category/journals/Nano%20Technology/", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80", accent: "#7c3aed" },
  { title: "Nursing", count: 17, href: "https://shop.stmjournals.com/product-category/journals/Nursing/", image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80", accent: "#be185d" },
  { title: "Pharmacy", count: 6, href: "https://shop.stmjournals.com/product-category/journals/Pharmacy/", image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80", accent: "#047857" },
  { title: "Material Science", count: 5, href: "https://shop.stmjournals.com/product-category/journals/Material%20Science/", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80", accent: "#4338ca" }
];

const totalJournals = collections.reduce((sum, item) => sum + item.count, 0);

export default function CataloguesMirrorPage() {
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
          <a href={masterLinks.stmPdf} target="_blank" rel="noreferrer" style={downloadBtn}>Download STM PDF</a>
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
                  <a href={masterLinks.stmPdf} target="_blank" rel="noreferrer" style={cardLightBtn}>PDF</a>
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
