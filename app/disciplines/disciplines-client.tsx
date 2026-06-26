"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type DomainInfo = { domain: string; count: number };

const domainImages: Record<string, string> = {
  "Agriculture": "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?auto=format&fit=crop&w=600&q=80",
  "Applied Mechanics": "https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?auto=format&fit=crop&w=600&q=80",
  "Applied Sciences": "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80",
  "Architecture": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
  "Ayurveda": "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&w=600&q=80",
  "Bio Technology": "https://images.unsplash.com/photo-1530213786676-41ad9f7736f6?auto=format&fit=crop&w=600&q=80",
  "Chemical Engineering": "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=600&q=80",
  "Chemistry": "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=600&q=80",
  "Civil/Construction Engineering": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
  "Computer/IT": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  "Education and Social Sciences": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  "Electrical Engineering": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80",
  "Electronics & Telecommunication Engineering": "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=600&q=80",
  "Energy": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
  "Law": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
  "Life Sciences": "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=600&q=80",
  "Management": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
  "Material Science": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80",
  "Mechanical Engineering": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80",
  "Medical Sciences": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
  "Multidisciplinary": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  "Nano Technology": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80",
  "Nursing": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
  "Pharmacy": "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&q=80"
};

const domainQuotes: Record<string, string> = {
  "Agriculture": "Pioneering sustainable farming, crop physiology, and next-generation agri-tech advancements.",
  "Applied Mechanics": "Exploring advanced fluid dynamics, structural mechanics, and materials processing.",
  "Applied Sciences": "Bridging scientific theory with practical technologies to solve complex industrial problems.",
  "Architecture": "Designing modern buildings, sustainable urban planning, and structural aesthetics.",
  "Ayurveda": "Revitalizing traditional medicine, holistic healthcare methodologies, and natural remedies.",
  "Bio Technology": "Advancing molecular research, genetic engineering, and groundbreaking bio-diagnostics.",
  "Chemical Engineering": "Optimizing industrial chemistry, process engineering, and molecular synthesis.",
  "Chemistry": "Investigating organic reactions, physical chemistry research, and modern material design.",
  "Civil/Construction Engineering": "Designing resilient buildings, green construction tech, and transport networks.",
  "Computer/IT": "Innovating in Generative AI, cloud computing architectures, and software engineering.",
  "Education and Social Sciences": "Empowering minds through learning research, social behaviors, and pedagogy.",
  "Electrical Engineering": "Powering smart grids, control engineering, and advanced electronic systems.",
  "Electronics & Telecommunication Engineering": "Shaping wireless networks, embedded hardware, and communication systems.",
  "Energy": "Innovating in solar technology, wind power, and sustainable resource management.",
  "Law": "Analyzing legal frameworks, corporate governance, human rights, and jurisprudence.",
  "Life Sciences": "Exploring biodiversity, environmental biology, and organismal ecosystems.",
  "Management": "Shaping future business strategies, organizational behavior, and leadership theories.",
  "Material Science": "Engineering advanced nanomaterials, polymers, and high-performance composites.",
  "Mechanical Engineering": "Innovating in robotics, thermal engineering, and CAD/CAM systems.",
  "Medical Sciences": "Improving clinical outcomes, disease diagnosis, and patient care systems.",
  "Multidisciplinary": "Connecting diverse research areas to inspire cross-domain scientific discovery.",
  "Nano Technology": "Manipulating atoms to pioneer smart drug delivery and microscopic devices.",
  "Nursing": "Elevating patient care, clinical nursing education, and healthcare administration.",
  "Pharmacy": "Shaping drug discovery, clinical pharmacy practices, and toxicology research."
};

const defaultImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80";
const defaultQuote = "Pioneering scholarly research, peer review excellence, and institutional discovery.";

export default function DisciplinesClient({ initialDomains }: { initialDomains: DomainInfo[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDomains = useMemo(() => {
    return initialDomains.filter((d) =>
      d.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialDomains, searchQuery]);

  return (
    <div>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto 40px",
        position: "relative"
      }}>
        <input
          type="text"
          placeholder="Search research discipline (e.g., Computer, Medical, Agriculture)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 24px 14px 50px",
            fontSize: "15px",
            borderRadius: "999px",
            border: "1px solid var(--line)",
            background: "var(--surface-soft)",
            color: "var(--text)",
            outline: "none",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.02)",
            fontFamily: "Outfit, sans-serif",
            transition: "all 0.3s"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--brand)";
            e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-glow)";
            e.currentTarget.style.background = "var(--surface)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--line)";
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.02)";
            e.currentTarget.style.background = "var(--surface-soft)";
          }}
        />
        <span style={{
          position: "absolute",
          left: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "18px",
          color: "var(--muted)"
        }}>🔍</span>
      </div>

      {filteredDomains.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "var(--muted)",
          border: "1px dashed var(--line)",
          borderRadius: "12px",
          background: "var(--surface)"
        }}>
          <p style={{ fontSize: "16px", margin: "0 0 12px 0" }}>No disciplines match your search criteria.</p>
          <button
            onClick={() => setSearchQuery("")}
            style={{
              background: "var(--brand)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "24px"
        }}>
          {filteredDomains.map((d) => {
            const image = domainImages[d.domain] || defaultImage;
            const quote = domainQuotes[d.domain] || defaultQuote;

            return (
              <div
                key={d.domain}
                className="discipline-card-wrapper"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <Link
                  href={`/product-category/journals/${encodeURIComponent(d.domain)}`}
                  style={{
                    position: "relative",
                    aspectRatio: "16/10",
                    display: "block",
                    overflow: "hidden"
                  }}
                >
                  <img
                    src={image}
                    alt={d.domain}
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
                    background: "linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.45) 50%, rgba(15, 23, 42, 0.1) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "20px",
                    pointerEvents: "none"
                  }}>
                    <h3 style={{
                      color: "#ffffff",
                      fontSize: "18px",
                      fontWeight: "700",
                      margin: 0,
                      letterSpacing: "0.01em"
                    }}>
                      {d.domain}
                    </h3>
                    <span style={{
                      color: "rgba(255, 255, 255, 0.85)",
                      fontSize: "12px",
                      fontWeight: "500",
                      marginTop: "3px"
                    }}>
                      {d.count} Active Journals
                    </span>
                  </div>
                </Link>

                <div style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexGrow: 1,
                  gap: "16px"
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: "1.6",
                    color: "var(--muted)",
                    fontStyle: "italic"
                  }}>
                    &ldquo;{quote}&rdquo;
                  </p>
                  
                  <Link
                    href={`/product-category/journals/${encodeURIComponent(d.domain)}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "var(--brand)",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      textDecoration: "none",
                      width: "fit-content",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--brand)";
                    }}
                  >
                    Browse Journals
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
