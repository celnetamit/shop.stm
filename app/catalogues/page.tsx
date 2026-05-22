import Link from "next/link";
import type { CSSProperties } from "react";

const masterLinks = {
  stmPdf: "https://shop.stmjournals.com/wp-content/uploads/2025/11/ae07f484-stm-journals-subscription-price-list-2026-.pdf",
  journalsPubPdf: "https://storage.googleapis.com/shop-stmjournals-com-wp-media-to-gcp-offload/2025/12/34b35c1a-journalspub-subscription-price-list-2026.pdf",
  sheet: "https://storage.googleapis.com/shop-stmjournals-com-wp-media-to-gcp-offload/2025/12/0dd84432-stm-journals-price-list-for-subscription-year-2026.xlsx"
};

const collections = [
  { title: "Agriculture", count: 6, href: "https://shop.stmjournals.com/product-category/journals/Agriculture/" },
  { title: "Applied Mechanics", count: 8, href: "https://shop.stmjournals.com/product-category/journals/Applied%20Mechanics/" },
  { title: "Applied Sciences", count: 8, href: "https://shop.stmjournals.com/product-category/journals/Applied%20Sciences/" },
  { title: "Architecture", count: 10, href: "https://shop.stmjournals.com/product-category/journals/Architecture/" },
  { title: "Ayurveda", count: 4, href: "https://shop.stmjournals.com/product-category/journals/Ayurveda/" },
  { title: "Bio Technology", count: 14, href: "https://shop.stmjournals.com/product-category/journals/Bio%20Technology/" },
  { title: "Chemical Engineering", count: 11, href: "https://shop.stmjournals.com/product-category/journals/Chemical%20Engineering/" },
  { title: "Chemistry", count: 14, href: "https://shop.stmjournals.com/product-category/journals/Chemistry/" },
  { title: "Computer/IT", count: 34, href: "https://shop.stmjournals.com/product-category/journals/Computer/IT/" },
  { title: "Education and Social Sciences", count: 7, href: "https://shop.stmjournals.com/product-category/journals/Education%20and%20Social%20Sciences/" },
  { title: "Energy", count: 5, href: "https://shop.stmjournals.com/product-category/journals/Energy/" },
  { title: "Law", count: 15, href: "https://shop.stmjournals.com/product-category/journals/Law/" },
  { title: "Management", count: 16, href: "https://shop.stmjournals.com/product-category/journals/Management/" },
  { title: "Medical Sciences", count: 25, href: "https://shop.stmjournals.com/product-category/journals/Medical%20Sciences/" },
  { title: "Nano Technology", count: 6, href: "https://shop.stmjournals.com/product-category/journals/Nano%20Technology/" },
  { title: "Nursing", count: 17, href: "https://shop.stmjournals.com/product-category/journals/Nursing/" },
  { title: "Pharmacy", count: 6, href: "https://shop.stmjournals.com/product-category/journals/Pharmacy/" },
  { title: "Material Science", count: 5, href: "https://shop.stmjournals.com/product-category/journals/Material%20Science/" }
];

export default function CataloguesMirrorPage() {
  return (
    <main style={{ maxWidth: "1260px", margin: "0 auto", padding: "22px 16px 34px" }}>
      <section style={{ border: "1px solid #dbe3f0", borderRadius: "18px", background: "linear-gradient(180deg,#ffffff,#f8fbff)", padding: "26px" }}>
        <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#5e74a0", fontWeight: 700 }}>Resource Center</p>
        <h1 style={{ margin: "8px 0", color: "#102a52", fontSize: "40px", lineHeight: 1.05 }}>Department Catalogs</h1>
        <p style={{ margin: 0, color: "#566987", fontSize: "15px" }}>Download comprehensive PDF catalogs for specific disciplines or the complete 2026 master list.</p>
        <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/catalogues-list?currency=INR" style={btnGhost}>View Price List (INR)</Link>
          <Link href="/catalogues-list?currency=USD" style={btnGhost}>View Global Prices (USD)</Link>
          <a href={masterLinks.sheet} target="_blank" rel="noreferrer" style={btnGhost}>Master Sheet</a>
        </div>
      </section>

      <section style={{ marginTop: "16px", border: "1px solid #dbe3f0", borderRadius: "18px", background: "#fff", padding: "22px" }}>
        <h2 style={{ margin: "0 0 6px", color: "#112d57", fontSize: "28px" }}>STM Journals Master Catalog (2026)</h2>
        <p style={{ margin: "0 0 14px", color: "#5f7398" }}>Complete list of journals, pricing, and indexing details.</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href={masterLinks.stmPdf} target="_blank" rel="noreferrer" style={btnPrimary}>Download Full PDF (STM)</a>
          <a href={masterLinks.journalsPubPdf} target="_blank" rel="noreferrer" style={btnPrimary}>Download Full PDF (JournalsPub)</a>
        </div>
      </section>

      <section style={{ marginTop: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "#22c55e" }} />
          <h3 style={{ margin: 0, fontSize: "22px", color: "#102a52" }}>Department Wise Collections</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "12px" }}>
          {collections.map((item) => (
            <article key={item.title} style={{ border: "1px solid #dbe3f0", borderRadius: "14px", background: "#fff", padding: "14px" }}>
              <p style={{ margin: 0, color: "#6c7f9f", fontSize: "12px", fontWeight: 700 }}>{item.count} Journals</p>
              <h4 style={{ margin: "8px 0 10px", color: "#123264", fontSize: "20px" }}>{item.title}</h4>
              <p style={{ margin: "0 0 12px", color: "#5c6e8f", fontSize: "13px" }}>Portfolio of peer-reviewed journals for {item.title} with Print, Online, and Print + Online access models.</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <a href={masterLinks.stmPdf} target="_blank" rel="noreferrer" style={btnGhostSmall}>Download PDF</a>
                <a href={item.href} target="_blank" rel="noreferrer" style={btnLinkSmall}>View Collection</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const btnPrimary: CSSProperties = {
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 700,
  color: "#fff",
  background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
  borderRadius: "999px",
  padding: "10px 16px",
  display: "inline-flex"
};

const btnGhost: CSSProperties = {
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 700,
  color: "#1e3a8a",
  background: "#eff5ff",
  border: "1px solid #c8d8fb",
  borderRadius: "999px",
  padding: "10px 16px",
  display: "inline-flex"
};

const btnGhostSmall: CSSProperties = {
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 700,
  color: "#1e3a8a",
  background: "#eff5ff",
  border: "1px solid #c8d8fb",
  borderRadius: "8px",
  padding: "7px 10px",
  display: "inline-flex"
};

const btnLinkSmall: CSSProperties = {
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 700,
  color: "#1e40af",
  background: "#fff",
  border: "1px solid #d6e0f0",
  borderRadius: "8px",
  padding: "7px 10px",
  display: "inline-flex"
};
