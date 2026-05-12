"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/app/components/cart-store";

type DomainLink = { domain: string; count: number };
type HomeJournal = {
  id: string;
  slug: string;
  journalName: string;
  subject: string;
  issn: string | null;
  printInr: number;
  onlineInr: number;
  combinedInr: number;
  imageUrl: string | null;
};

export default function HomeSections({ domains, journals }: { domains: DomainLink[]; journals: HomeJournal[] }) {
  const { addItem } = useCart();
  const [planById, setPlanById] = useState<Record<string, "PRINT" | "ONLINE" | "PRINT_ONLINE">>({});

  const priceFor = (j: HomeJournal, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE") =>
    plan === "ONLINE" ? j.onlineInr : plan === "PRINT_ONLINE" ? j.combinedInr : j.printInr;

  return (
    <section className="home-sections" style={{ marginTop: "30px", display: "grid", gap: "40px" }}>
      {/* Browse by Discipline */}
      <div className="home-section-block hide-on-mobile" style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "4px",
        padding: "30px 24px"
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "24px",
          color: "#0F172A",
          marginBottom: "20px",
          fontWeight: "700",
          borderLeft: "4px solid #F59E0B",
          paddingLeft: "12px"
        }}>Browse by Discipline</h2>
        <div className="home-discipline-grid" style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          {domains.map((d) => (
            <a
              key={d.domain}
              href={`/product-category/journals/${encodeURIComponent(d.domain)}`}
              className="transition-smooth"
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                color: "#334155",
                borderRadius: "9999px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: "500",
                textDecoration: "none",
                display: "inline-block"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(245, 158, 11, 0.08)";
                e.currentTarget.style.borderColor = "#F59E0B";
                e.currentTarget.style.color = "#F59E0B";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.color = "#334155";
              }}
            >
              {d.domain} <span style={{ color: "#64748b", fontWeight: "400", marginLeft: "4px" }}>({d.count})</span>
            </a>
          ))}
        </div>
      </div>

      {/* Trending Subscriptions */}
      <div className="home-section-block" style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "4px",
        padding: "30px 24px"
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "24px",
          color: "#0F172A",
          marginBottom: "20px",
          fontWeight: "700",
          borderLeft: "4px solid #F59E0B",
          paddingLeft: "12px"
        }}>Trending Subscriptions</h2>
        <div className="home-trending-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "24px"
        }}>
          {journals.map((j) => {
            const plan = planById[j.id] || "PRINT";
            const price = priceFor(j, plan);
            const originalPrice = Math.floor(price * 1.25);
            const savings = originalPrice - price;

            return (
              <article
                className="home-trend-card card-hover-lift transition-smooth"
                key={j.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "4px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative"
                }}
              >
                {/* Image Frame */}
                <Link href={`/product/${j.slug}`} style={{ display: "block", marginBottom: "12px", overflow: "hidden", borderRadius: "2px", background: "#f8fafc", height: "180px" }}>
                  <img
                    src={j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal"}
                    alt={j.journalName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      transition: "transform 0.5s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  />
                </Link>

                {/* Info */}
                <div style={{ flexGrow: 1, marginBottom: "10px" }}>
                  <h3 style={{
                    margin: "0 0 4px 0",
                    fontSize: "13px",
                    fontWeight: "700",
                    lineHeight: "1.4",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontFamily: "Outfit, sans-serif"
                  }}>
                    <Link href={`/product/${j.slug}`} style={{ color: "#0F172A", textDecoration: "none" }}>{j.journalName}</Link>
                  </h3>
                  <p style={{
                    margin: "0",
                    fontSize: "11px",
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "Outfit, sans-serif"
                  }}>
                    {j.subject}
                    {j.issn ? ` | ISSN ${j.issn}` : ""}
                  </p>
                </div>

                {/* Selector and Price row inline like screenshot */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <select
                    value={plan}
                    onChange={(e) =>
                      setPlanById((prev) => ({
                        ...prev,
                        [j.id]: e.target.value as "PRINT" | "ONLINE" | "PRINT_ONLINE"
                      }))
                    }
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      padding: "6px 8px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      background: "#ffffff",
                      cursor: "pointer",
                      fontFamily: "Outfit, sans-serif",
                      minWidth: "0"
                    }}
                  >
                    <option value="PRINT">Print</option>
                    <option value="ONLINE">Online</option>
                    <option value="PRINT_ONLINE">Combined</option>
                  </select>
                  <strong style={{ fontSize: "15px", color: "#0d3cb1", fontWeight: "800", whiteSpace: "nowrap" }}>₹{price.toLocaleString("en-IN")}</strong>
                </div>

                {/* Solid Blue Add To Cart Button */}
                <button
                  type="button"
                  className="transition-smooth"
                  onClick={() =>
                    addItem({
                      id: `${j.id}-${plan}`,
                      journalName: j.journalName,
                      subject: j.subject,
                      issn: j.issn,
                      image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                      year: "2026",
                      plan,
                      unitPrice: price
                    })
                  }
                  style={{
                    width: "100%",
                    background: "#2563EB",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1d4ed8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#2563EB";
                  }}
                >
                  Add to Cart
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

