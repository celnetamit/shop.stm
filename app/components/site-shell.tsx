"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/components/cart-store";
import { useEffect, useState, useRef } from "react";

type SessionUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};
type DomainCount = { domain: string; count: number };

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items } = useCart();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [domains, setDomains] = useState<DomainCount[]>([]);
  const hideChrome = pathname.startsWith("/checkout") || pathname.startsWith("/payment");
  const count = items.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { ok: boolean; user?: SessionUser | null }) => {
        if (!active) return;
        setUser(json.ok && json.user ? json.user : null);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    let active = true;
    fetch("/api/domains", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { ok: boolean; domains?: DomainCount[] }) => {
        if (!active) return;
        setDomains(json.ok && json.domains ? json.domains : []);
      })
      .catch(() => {
        if (!active) return;
        setDomains([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const [openDropdown, setOpenDropdown] = useState<"disciplines" | "account" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const disciplinesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.results || []);
          setIsSearching(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns ONLY if clicking COMPLETELY outside of either relative container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideAccount = accountDropdownRef.current?.contains(target);
      const isInsideDisciplines = disciplinesDropdownRef.current?.contains(target);
      
      if (!isInsideAccount && !isInsideDisciplines) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {!hideChrome ? (
        <header className="site-header site-main-header" style={{ borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 50, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)" }}>
          <div className="site-topbar" style={{
            maxWidth: "1300px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px"
          }}>
            <Link href="/" className="site-brand" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: "900",
              fontSize: "26px",
              letterSpacing: "0.02em",
              color: "#0F172A",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <img src="/stmlogo.png" alt="STM Journals" style={{ height: "65px", width: "auto", objectFit: "contain" }} />
            </Link>
            
            <div className="site-search" style={{ position: "relative", flex: "1 1 400px", maxWidth: "600px", minWidth: "280px", margin: "0 auto" }}>
              <input
                type="text"
                placeholder="Search Journal, Book or ISSN..."
                aria-label="Search Journal, Book or ISSN"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 20px 12px 44px",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: "Outfit, sans-serif",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: "#F8FAFC",
                  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3B82F6";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
                  e.currentTarget.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (e.target) {
                      e.target.style.borderColor = "#E2E8F0";
                      e.target.style.boxShadow = "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)";
                      e.target.style.background = "#F8FAFC";
                    }
                  }, 200);
                }}
              />
              <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "16px" }}>🔍</span>
              {searchQuery.length >= 2 && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", zIndex: 100, maxHeight: "400px", overflowY: "auto" }}>
                  {isSearching ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#64748B", fontSize: "14px", fontFamily: "Outfit, sans-serif" }}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#64748B", fontSize: "14px", fontFamily: "Outfit, sans-serif" }}>No results found.</div>
                  ) : (
                    <div style={{ padding: "8px" }}>
                      {searchResults.map((res: any) => (
                        <Link key={res.slug} href={`/product/${res.slug}`} onClick={() => setSearchQuery("")} style={{ display: "block", padding: "10px 12px", textDecoration: "none", color: "#1E293B", borderRadius: "8px", transition: "background 0.2s", fontFamily: "Outfit, sans-serif" }} onMouseOver={e => e.currentTarget.style.background = "#F1F5F9"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <div style={{ fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.journalName}</div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>{res.subject} {res.issn ? `• ISSN: ${res.issn}` : ""}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="site-utils" style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              {user ? (
                <div style={{ position: "relative" }} ref={accountDropdownRef}>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === "account" ? null : "account")}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "Outfit, sans-serif", color: "#334155", fontWeight: "600", fontSize: "14px" }}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontWeight: "bold" }}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    My Account ▾
                  </button>
                  {openDropdown === "account" && (
                    <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: "220px", background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 100 }}>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px" }}>Signed in as<br/><strong style={{ color: "#0F172A", fontSize: "13px" }}>{user.email}</strong></p>
                      <Link href="/account" onClick={() => setOpenDropdown(null)} style={{ color: "#3B82F6", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}><span>📊</span> Dashboard</Link>
                      {user.role === "ADMIN" && <Link href="/admin" onClick={() => setOpenDropdown(null)} style={{ color: "#8B5CF6", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}><span>⚙️</span> Admin Panel</Link>}
                      <a href="/api/auth/logout" style={{ color: "#EF4444", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", borderTop: "1px solid #F1F5F9", paddingTop: "10px" }}><span>🚪</span> Logout</a>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" style={{ fontSize: "14px", fontWeight: "600", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>Login</Link>
              )}
              <Link href="/cart" style={{
                background: "#0F172A",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                fontFamily: "Outfit, sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.2)",
                transition: "all 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
              >
                <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Cart {count > 0 && <span style={{ background: "#F59E0B", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", marginLeft: "4px" }}>{count}</span>}
              </Link>
            </div>
          </div>
          
          <div className="site-header-inner" style={{ borderTop: "1px solid #E2E8F0", padding: "0" }}>
            <nav className="site-nav" style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px", display: "flex", gap: "32px", justifyContent: "center", alignItems: "center", minHeight: "50px" }}>
              <Link href="/" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#3B82F6"} onMouseOut={e => e.currentTarget.style.color = "#475569"}>Home</Link>
              <Link href="/about-us" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#3B82F6"} onMouseOut={e => e.currentTarget.style.color = "#475569"}>About Us</Link>
              
              {/* Disciplines Clickable Dropdown */}
              <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }} ref={disciplinesDropdownRef}>
                <button 
                  onClick={() => setOpenDropdown(openDropdown === "disciplines" ? null : "disciplines")}
                  style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: openDropdown === "disciplines" ? "#3B82F6" : "#475569", textDecoration: "none", fontFamily: "Outfit, sans-serif", display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s", padding: 0 }}
                  onMouseOver={e => e.currentTarget.style.color = "#3B82F6"} 
                  onMouseOut={e => e.currentTarget.style.color = openDropdown === "disciplines" ? "#3B82F6" : "#475569"}
                >
                  Browse Disciplines
                  <span style={{ fontSize: "10px", transform: openDropdown === "disciplines" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                
                {openDropdown === "disciplines" && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: "900px", background: "white", border: "1px solid #E2E8F0", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", padding: "24px", zIndex: 100 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                      {domains.map((d) => (
                        <Link key={d.domain} href={`/product-category/journals/${encodeURIComponent(d.domain)}`} onClick={() => setOpenDropdown(null)} style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", color: "#1E293B", fontSize: "14px", fontWeight: "500", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB";}} onMouseOut={e => {e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#1E293B";}}>
                          {d.domain} <span style={{ fontSize: "12px", color: "#64748B", background: "white", padding: "2px 8px", borderRadius: "99px" }}>{d.count}</span>
                        </Link>
                      ))}
                    </div>
                    <div style={{ marginTop: "24px", textAlign: "center" }}>
                      <Link href="/catalogues-list" onClick={() => setOpenDropdown(null)} style={{ background: "#0F172A", color: "white", padding: "10px 24px", borderRadius: "99px", textDecoration: "none", fontSize: "14px", fontWeight: "bold", display: "inline-block" }}>View Full Catalog</Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/books" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#3B82F6"} onMouseOut={e => e.currentTarget.style.color = "#475569"}>Books</Link>
              <Link href="/for-librarians" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#3B82F6"} onMouseOut={e => e.currentTarget.style.color = "#475569"}>For Librarians</Link>
              <Link href="/for-agencies" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#3B82F6"} onMouseOut={e => e.currentTarget.style.color = "#475569"}>For Agencies</Link>
              <Link href="/get-proforma-invoice-quote" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#F59E0B", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#D97706"} onMouseOut={e => e.currentTarget.style.color = "#F59E0B"}>Get Proforma/Quote</Link>
            </nav>
          </div>
        </header>
      ) : null}

      {children}

      {!hideChrome ? (
        <footer className="site-footer" style={{ background: "#060a11", color: "#8b9ebd", paddingTop: "50px", paddingBottom: "20px", marginTop: "40px", fontFamily: "Arial, sans-serif" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "40px" }}>
            
            {/* Column 1: Company Info */}
            <div>
              <Link href="/" style={{ display: "block", marginBottom: "12px" }}>
                <img src="/stmlogo.png" alt="STM Journals" style={{ height: "38px", filter: "brightness(0) invert(1)", objectFit: "contain" }} />
              </Link>
              <div style={{ color: "#8b9ebd", fontSize: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "#f97316", letterSpacing: "1px" }}>----</span> Scientific <span style={{ color: "#f97316" }}>•</span> Technical <span style={{ color: "#f97316" }}>•</span> Medical
              </div>
              <p style={{ color: "#8b9ebd", fontSize: "12px", lineHeight: "1.6", marginBottom: "20px" }}>
                A premier global platform for scientific and medical research. An imprint of Consortium eLearning Network Pvt. Ltd. (Est. 2001).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "14px" }}>✉️</span>
                  <a href="mailto:subscriptions@stmjournals.com" style={{ color: "#8b9ebd", textDecoration: "none" }}>subscriptions@stmjournals.com</a>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "14px", marginTop: "2px" }}>📞</span>
                  <div>
                    <a href="tel:+919810078950" style={{ color: "#8b9ebd", textDecoration: "none", display: "block" }}>+91-9810078950 (M)</a>
                    <a href="tel:+911204781200" style={{ color: "#8b9ebd", textDecoration: "none", display: "block", marginTop: "4px" }}>+91-0120-4781200 / 208 (L)</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: EDITORIAL & INSTITUTIONAL */}
            <div>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#3B82F6", marginBottom: "20px", textTransform: "uppercase", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>EDITORIAL & INSTITUTIONAL</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                <li><Link href="/for-authors" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>📝</span> For Authors</Link></li>
                <li><Link href="/for-reviewers" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>✅</span> For Reviewers</Link></li>
                <li><Link href="/for-librarians" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🏛️</span> Information for Librarians</Link></li>
                <li><Link href="/for-agencies" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🤝</span> Agency Partnership</Link></li>
                <li><Link href="/catalogues-list" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>📄</span> Download catalogue</Link></li>
              </ul>
            </div>

            {/* Column 3: PRICING & SUPPORT */}
            <div>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#3B82F6", marginBottom: "20px", textTransform: "uppercase", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>PRICING & SUPPORT</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                <li><Link href="/catalogues-list" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🏷️</span> Pricing List (INR)</Link></li>
                <li><Link href="/catalogues-list" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🌐</span> International Pricing (USD)</Link></li>
                <li><Link href="/contact-us" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>💬</span> Contact Support</Link></li>
                <li><Link href="/faq" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>⏱️</span> FAQ Center</Link></li>
                <li><Link href="/policies" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🚚</span> Shipping & Policies</Link></li>
                <li><Link href="/terms-and-conditions" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🏛️</span> Terms of Service</Link></li>
              </ul>
            </div>
            
            {/* Column 4: LATEST RESEARCH BLOG */}
            <div>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#3B82F6", marginBottom: "20px", textTransform: "uppercase", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>LATEST RESEARCH BLOG</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <Link href="/" style={{ color: "#3B82F6", textDecoration: "none", fontSize: "12px", lineHeight: "1.5", display: "block", marginBottom: "4px" }}>Call for Papers: Current Trends in Information Technology</Link>
                  <Link href="/" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "11px" }}>Read More</Link>
                </div>
                <div>
                  <Link href="/" style={{ color: "#3B82F6", textDecoration: "none", fontSize: "12px", lineHeight: "1.5", display: "block", marginBottom: "4px" }}>Call for Papers: Current Trends in Information Technology – Advancing the Future of Information Science</Link>
                  <Link href="/" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "11px" }}>Read More</Link>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ maxWidth: "1300px", margin: "40px auto 0", padding: "20px 20px", borderTop: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <p style={{ margin: 0, color: "#8b9ebd", fontSize: "11px" }}>
              Copyright {new Date().getFullYear()} Consortium e-Learning Network Pvt. Ltd., all rights reserved.
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              <Link href="/privacy-policy" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "11px" }}>Privacy policy</Link>
            </div>
          </div>
        </footer>
      ) : null}
    </>
  );
}
