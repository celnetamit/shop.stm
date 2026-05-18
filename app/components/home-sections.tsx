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

  // 📞 Query Form States & Handlers
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "Homepage Enquiry", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleHomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: "error", text: "⚠️ Please fill out all required fields." });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.ok) {
        setStatus({ type: "success", text: "🎉 Thank you! Your query has been recorded. Our team will contact you shortly." });
        setFormData({ name: "", email: "", phone: "", subject: "Homepage Enquiry", message: "" });
      } else {
        setStatus({ type: "error", text: data.error || "Enquiry submission failed." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

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
              href="/catalogues-list" 
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
              </article>
            );
          })}
        </div>
      </div>

      {/* 3. Any Queries Contact Form Section below Trending Subscriptions */}
      <div className="home-section-block" style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "12px",
        padding: "40px 32px",
        boxShadow: "var(--shadow-md)",
        transition: "all 0.3s ease",
        marginTop: "20px"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "start" }}>
          {/* Left Column: Address and Info */}
          <div>
            <span style={{
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--brand)",
              background: "var(--accent-glow)",
              padding: "6px 14px",
              borderRadius: "999px",
              display: "inline-block",
              marginBottom: "16px"
            }}>
              STM Support Desk
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "36px",
              color: "var(--text)",
              fontWeight: "800",
              margin: "0 0 16px 0",
              letterSpacing: "-0.01em"
            }}>
              Any Queries ?
            </h2>
            <p style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "15px",
              color: "var(--muted)",
              lineHeight: "1.6",
              marginBottom: "30px"
            }}>
              Have questions about journal access, subscription rates, custom library quotes, or book publications? Reach out to us directly!
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Address */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{
                  background: "var(--accent-glow)",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Office Address</h4>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", lineHeight: "1.5", fontFamily: "Outfit, sans-serif" }}>
                    Consortium e-Learning Network Pvt. Ltd.<br />
                    A-118, 1st Floor, Sector-63,<br />
                    Noida, U.P. 201301, India
                  </p>
                </div>
              </div>

              {/* Email */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{
                  background: "var(--accent-glow)",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Email Support</h4>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>
                    <a href="mailto:info@stmjournals.com" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: "600" }}>info@stmjournals.com</a>
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{
                  background: "var(--accent-glow)",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "var(--text)", fontFamily: "Outfit, sans-serif" }}>Call Center</h4>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", fontFamily: "Outfit, sans-serif" }}>
                    +91-120-4781200 / +91-120-4781211
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div style={{
            background: "var(--surface-soft)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "var(--shadow-sm)"
          }}>
            <form onSubmit={handleHomeSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g. Dr. Amit Sharma"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="amit@univ.edu"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="E.g. +91 9876543210"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="General Subscription Enquiry"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text)", letterSpacing: "0.05em" }}>Your Message *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist you today? Please enter your queries..."
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {status && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  background: status.type === "success" ? "rgba(22, 163, 74, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: status.type === "success" ? "1px solid rgba(22, 163, 74, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                  color: status.type === "success" ? "#16a34a" : "#ef4444"
                }}>
                  {status.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--brand)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  fontWeight: "700",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.15)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "var(--brand-dark)";
                    e.currentTarget.style.boxShadow = "0 4px 12px var(--accent-glow)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "var(--brand)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(37, 99, 235, 0.15)";
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Sending Enquiry...
                  </>
                ) : "Send Your Enquiry"}
              </button>
            </form>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}} />
          </div>
        </div>
      </div>
    </section>
  );
}
