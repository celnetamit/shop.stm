"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/app/components/cart-store";
import { buildJournalCartItemId } from "@/lib/journal-cart";

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
  const { addItem, items, removeItem, setQty } = useCart();
  const [planById, setPlanById] = useState<Record<string, "PRINT" | "ONLINE" | "PRINT_ONLINE">>({});




  const priceFor = (j: HomeJournal, plan: "PRINT" | "ONLINE" | "PRINT_ONLINE") =>
    plan === "ONLINE" ? j.onlineInr : plan === "PRINT_ONLINE" ? j.combinedInr : j.printInr;

  return (
    <section className="home-sections" style={{ marginTop: "30px", display: "grid", gap: "40px" }}>
      {/* Browse by Discipline */}
      <div className="home-section-block" style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "12px",
        padding: "40px 24px",
        boxShadow: "var(--shadow-md)",
        transition: "background 0.3s, border-color 0.3s"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "30px",
            color: "var(--text)",
            fontWeight: "700",
            margin: 0
          }}>Browse by Discipline</h2>
          <p style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "15px",
            color: "var(--muted)",
            margin: 0
          }}>Explore top research categories shaping the future.</p>
        </div>
        
        <div className="home-discipline-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "28px"
        }}>
          {[
            {
              key: "Computer/IT",
              displayName: "Computer/IT",
              image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
              quote: "Driving global innovation in Generative AI, Cybersecurity, and Quantum Computing architectures."
            },
            {
              key: "Medical Sciences",
              displayName: "Medical",
              image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
              quote: "Advancing patient care, disease prevention, and groundbreaking clinical methodologies globally."
            },
            {
              key: "Civil/Construction Engineering",
              displayName: "Civil/Construction Engineering",
              image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
              quote: "Designing sustainable infrastructures, smart materials, and future-ready urban ecosystems."
            },
            {
              key: "Mechanical Engineering",
              displayName: "Mechanical Engineering",
              image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80",
              quote: "Engineering smart robotics, advanced thermodynamics, and automated industrial solutions."
            },
            {
              key: "Pharmacy",
              displayName: "Pharmacy",
              image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&q=80",
              quote: "Pioneering drug discovery, pharmaceutical chemistry, and modern clinical therapeutics."
            },
            {
              key: "Bio Technology",
              displayName: "Bio Technology",
              image: "https://images.unsplash.com/photo-1530213786676-41ad9f7736f6?auto=format&fit=crop&w=600&q=80",
              quote: "Harnessing genetic research, molecular biology, and cutting-edge life science innovations."
            }
          ].map((item) => {
            const count = domains.find((d) => d.domain === item.key)?.count || 0;
            return (
              <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <a 
                  href={`/product-category/journals/${encodeURIComponent(item.key)}`} 
                  style={{
                    position: "relative",
                    borderRadius: "10px",
                    overflow: "hidden",
                    aspectRatio: "16/10",
                    display: "block",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.displayName} 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.4) 40%, rgba(15, 23, 42, 0.1) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "20px",
                    pointerEvents: "none"
                  }}>
                    <h3 style={{
                      color: "#ffffff",
                      fontSize: "19px",
                      fontWeight: "700",
                      margin: 0,
                      fontFamily: "Outfit, sans-serif",
                      letterSpacing: "0.01em"
                    }}>{item.displayName}</h3>
                    <span style={{
                      color: "rgba(255, 255, 255, 0.85)",
                      fontSize: "12.5px",
                      fontWeight: "500",
                      marginTop: "3px",
                      fontFamily: "Outfit, sans-serif"
                    }}>{count} Journals</span>
                  </div>
                </a>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "6px" }}>
                      <polygon points="12,3 2,21 22,21" />
                    </svg>
                    <p style={{
                      margin: 0,
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: "var(--muted)",
                      fontFamily: "Outfit, sans-serif"
                    }}>
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                  <a 
                    href={`/product-category/journals/${encodeURIComponent(item.key)}`}
                    className="transition-smooth"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "var(--brand)",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      textDecoration: "none",
                      fontFamily: "Outfit, sans-serif",
                      width: "fit-content"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--accent)";
                      const icon = e.currentTarget.querySelector(".arrow-icon") as HTMLElement;
                      if (icon) icon.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--brand)";
                      const icon = e.currentTarget.querySelector(".arrow-icon") as HTMLElement;
                      if (icon) icon.style.transform = "translateX(0)";
                    }}
                  >
                    Browse Journals
                    <svg className="arrow-icon transition-smooth" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s" }}>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Full navigation link below the grid */}
        <div style={{
          marginTop: "35px",
          textAlign: "center",
          borderTop: "1px dashed var(--line)",
          paddingTop: "20px"
        }}>
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "13.5px", color: "var(--muted)", margin: 0 }}>
            Looking for other academic fields?{" "}
            <a 
              href="/disciplines" 
              style={{ color: "var(--brand)", fontWeight: "700", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              Explore all {domains.length} research disciplines &rarr;
            </a>
          </p>
        </div>
      </div>

      {/* Trending Subscriptions */}
      <div className="home-section-block" style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "12px",
        padding: "30px 24px",
        boxShadow: "var(--shadow-md)",
        transition: "background 0.3s, border-color 0.3s"
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "24px",
          color: "var(--text)",
          marginBottom: "20px",
          fontWeight: "700",
          borderLeft: "4px solid var(--brand)",
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
            const cartItemId = buildJournalCartItemId(j.id, plan, "2026", "All(Jan-Dec)");
            const qty = items.filter((it) => it.id === cartItemId).reduce((sum, it) => sum + it.qty, 0);

            return (
              <article
                className="home-trend-card card-hover-lift transition-smooth"
                key={j.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                {/* Image Frame */}
                <Link href={`/product/${j.slug}`} style={{ display: "block", marginBottom: "12px", overflow: "hidden", borderRadius: "8px", background: "var(--surface-soft)", height: "180px", border: "1px solid var(--line)", transition: "border-color 0.3s" }}>
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
                    fontSize: "13.5px",
                    fontWeight: "700",
                    lineHeight: "1.45",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontFamily: "Outfit, sans-serif"
                  }}>
                    <Link href={`/product/${j.slug}`} style={{ color: "var(--text)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--brand)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text)"}>{j.journalName}</Link>
                  </h3>
                  <p style={{
                    margin: "0",
                    fontSize: "11px",
                    color: "var(--muted)",
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
                      border: "1px solid var(--line)",
                      background: "var(--surface-soft)",
                      color: "var(--text)",
                      cursor: "pointer",
                      fontFamily: "Outfit, sans-serif",
                      minWidth: "0",
                      outline: "none"
                    }}
                  >
                    <option value="PRINT">Print</option>
                    <option value="ONLINE">Online</option>
                    <option value="PRINT_ONLINE">Combined</option>
                  </select>
                  <strong style={{ fontSize: "15px", color: "var(--brand)", fontWeight: "800", whiteSpace: "nowrap" }}>₹{price.toLocaleString("en-IN")}</strong>
                </div>

                {/* Cart Action Controls */}
                {qty > 0 ? (
                  <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                    <button
                      type="button"
                      onClick={() => setQty(cartItemId, qty - 1)}
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "var(--surface-soft)",
                        border: "1px solid var(--line)",
                        color: "var(--text)",
                        borderRadius: "8px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "15px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--line)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-soft)"}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: cartItemId,
                          journalName: j.journalName,
                          subject: j.subject,
                          issn: j.issn,
                          image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                          year: "2026",
                          issue: "All(Jan-Dec)",
                          plan,
                          unitPrice: price
                        })
                      }
                      style={{
                        flex: 1,
                        height: "36px",
                        background: "var(--brand)",
                        border: "none",
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--brand-dark)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--brand)"}
                    >
                      In Cart: {qty}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(cartItemId)}
                      style={{
                        padding: "0 8px",
                        height: "36px",
                        background: "var(--surface-soft)",
                        border: "1px solid var(--line)",
                        color: "#ef4444",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fef2f2";
                        e.currentTarget.style.borderColor = "#fee2e2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--surface-soft)";
                        e.currentTarget.style.borderColor = "var(--line)";
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="transition-smooth"
                    onClick={() =>
                      addItem({
                        id: cartItemId,
                        journalName: j.journalName,
                        subject: j.subject,
                        issn: j.issn,
                        image: j.imageUrl || "https://dummyimage.com/360x460/eaf0ff/17366f.png&text=STM+Journal",
                        year: "2026",
                        issue: "All(Jan-Dec)",
                        plan,
                        unitPrice: price
                      })
                    }
                    style={{
                      width: "100%",
                      background: "var(--brand)",
                      border: "none",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "10px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.15)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--brand-dark)";
                      e.currentTarget.style.boxShadow = "0 4px 12px var(--accent-glow)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--brand)";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(37, 99, 235, 0.15)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Add to Cart
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>


    </section>
  );
}
