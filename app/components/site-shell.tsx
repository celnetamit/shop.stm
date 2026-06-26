"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/components/cart-store";
import { useEffect, useState, useRef } from "react";
import PublicChatbot from "@/app/components/public-chatbot";
import CookieConsentBanner from "@/app/components/cookie-consent-banner";

type SessionUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR";
};
type DomainCount = { domain: string; count: number };

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items, setQty, removeItem, couponCode, discountPercent, setCoupon } = useCart();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [domains, setDomains] = useState<DomainCount[]>([]);
  const [totalJournals, setTotalJournals] = useState<number>(0);
  const hideChrome = pathname.startsWith("/checkout") || pathname.startsWith("/payment");
  const count = items.reduce((s, i) => s + i.qty, 0);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isInternationalUser, setIsInternationalUser] = useState(false);
  const USD_RATE = 83;
  const [drawerCoupon, setDrawerCoupon] = useState("");
  const [drawerCouponMsg, setDrawerCouponMsg] = useState("");

  const prevCountRef = useRef(count);
  useEffect(() => {
    if (count > prevCountRef.current) {
      setIsCartDrawerOpen(true);
    }
    prevCountRef.current = count;
  }, [count]);

  useEffect(() => {
    setDrawerCoupon(couponCode);
  }, [couponCode]);

  useEffect(() => {
    let active = true;
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { ok: boolean; isInternational?: boolean }) => {
        if (!active) return;
        setIsInternationalUser(!!json.ok && !!json.isInternational);
      })
      .catch(() => {
        if (!active) return;
        setIsInternationalUser(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function money(valueInInr: number) {
    if (isInternationalUser) return `$${(valueInInr / USD_RATE).toFixed(2)}`;
    return `₹${valueInInr.toLocaleString("en-IN")}`;
  }

  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const total = subtotal - discount;

  async function applyDrawerCoupon() {
    setDrawerCouponMsg("");
    const code = drawerCoupon.trim().toUpperCase();
    if (!code) {
      setCoupon("", 0);
      return;
    }
    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
    const json = (await res.json()) as { ok: boolean; error?: string; coupon?: { code: string; discount: number } };
    if (!json.ok || !json.coupon) {
      setCoupon("", 0);
      setDrawerCouponMsg(json.error || "Invalid coupon");
      return;
    }
    setCoupon(json.coupon.code, json.coupon.discount);
    setDrawerCouponMsg(`Applied ${json.coupon.code} (${json.coupon.discount}% off)`);
  }


  useEffect(() => {
    const savedTheme = localStorage.getItem("stm-theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("stm-theme", nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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
      .then((json: { ok: boolean; domains?: DomainCount[]; total?: number }) => {
        if (!active) return;
        setDomains(json.ok && json.domains ? json.domains : []);
        setTotalJournals(json.ok && typeof json.total === "number" ? json.total : (json.domains || []).reduce((sum, item) => sum + item.count, 0));
      })
      .catch(() => {
        if (!active) return;
        setDomains([]);
        setTotalJournals(0);
      });
    return () => {
      active = false;
    };
  }, []);

  const [openDropdown, setOpenDropdown] = useState<"disciplines" | "account" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const disciplinesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

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
        <header className="site-header site-main-header" style={{ borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 50, background: "var(--glass-bg)", backdropFilter: "var(--glass-blur)", transition: "background 0.3s, border-color 0.3s" }}>
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
              color: "var(--text)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <img src="/stmlogo.png" alt="STM Journals" style={{ height: "65px", width: "auto", objectFit: "contain" }} />
            </Link>
            
            <div className="site-search" style={{ position: "relative", flex: "1 1 400px", maxWidth: "600px", minWidth: "0", width: "100%", margin: "0 auto" }}>
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
                  border: "1px solid var(--line)",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: "Outfit, sans-serif",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: "var(--surface-soft)",
                  color: "var(--text)",
                  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-glow)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (e.target) {
                      e.target.style.borderColor = "var(--line)";
                      e.target.style.boxShadow = "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)";
                      e.target.style.background = "var(--surface-soft)";
                    }
                  }, 200);
                }}
              />
              <span style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "16px" }}>🔍</span>
              {searchQuery.length >= 2 && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow-md)", zIndex: 100, maxHeight: "400px", overflowY: "auto" }}>
                  {isSearching ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "14px", fontFamily: "Outfit, sans-serif" }}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "14px", fontFamily: "Outfit, sans-serif" }}>No results found.</div>
                  ) : (
                    <div style={{ padding: "8px" }}>
                      {searchResults.map((res: any) => (
                        <Link key={res.slug} href={`/product/${res.slug}`} onClick={() => setSearchQuery("")} style={{ display: "block", padding: "10px 12px", textDecoration: "none", color: "var(--text)", borderRadius: "8px", transition: "background 0.2s", fontFamily: "Outfit, sans-serif" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface-soft)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <div style={{ fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.journalName}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>{res.subject} {res.issn ? `• ISSN: ${res.issn}` : ""}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="site-utils" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={toggleTheme}
                className="transition-smooth"
                aria-label="Toggle theme"
                style={{
                  background: "var(--surface-soft)",
                  border: "1px solid var(--line)",
                  color: "var(--text)",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "18px",
                  boxShadow: "var(--shadow-sm)",
                  padding: "0",
                  outline: "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08) rotate(15deg)";
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.boxShadow = "0 0 12px var(--accent-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>

              {user ? (
                <div style={{ position: "relative" }} ref={accountDropdownRef}>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === "account" ? null : "account")}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "Outfit, sans-serif", color: "var(--text)", fontWeight: "600", fontSize: "14px" }}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontWeight: "bold" }}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    My Account ▾
                  </button>
                  {openDropdown === "account" && (
                    <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: "220px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "var(--shadow-md)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 100 }}>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>Signed in as<br/><strong style={{ color: "var(--text)", fontSize: "13px" }}>{user.email}</strong></p>
                      <Link href="/account" onClick={() => setOpenDropdown(null)} style={{ color: "var(--brand)", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}><span>📊</span> Dashboard</Link>
                      {user.role === "ADMIN" && <Link href="/admin" onClick={() => setOpenDropdown(null)} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}><span>⚙️</span> Admin Panel</Link>}
                      <a href="/api/auth/logout" style={{ color: "#EF4444", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}><span>🚪</span> Logout</a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Link
                    href="/login"
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontFamily: "Outfit, sans-serif",
                      padding: "9px 14px",
                      borderRadius: "999px",
                      border: "1px solid var(--line)",
                      background: "var(--surface)"
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontFamily: "Outfit, sans-serif",
                      padding: "9px 15px",
                      borderRadius: "999px",
                      border: "1px solid transparent",
                      background: "linear-gradient(135deg, #1d4ed8, #2563eb)"
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
              <button 
                onClick={() => setIsCartDrawerOpen(true)}
                style={{
                  background: "var(--brand)",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
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
                Cart {count > 0 && <span style={{ background: "var(--accent)", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", marginLeft: "4px" }}>{count}</span>}
              </button>
            </div>
          </div>
          
          <div className="site-header-inner" style={{ borderTop: "1px solid var(--line)", padding: "0" }}>
            <div className="mobile-nav-toggle-row" style={{ maxWidth: "1300px", margin: "0 auto", padding: "8px 14px", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="mobile-nav-toggle"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((v) => !v)}
                style={{ border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "8px", width: "40px", height: "36px", cursor: "pointer", color: "var(--text)", fontSize: "20px", lineHeight: 1 }}
              >
                {mobileMenuOpen ? "×" : "☰"}
              </button>
            </div>

            <nav className={`site-nav ${mobileMenuOpen ? "mobile-open" : "mobile-closed"}`} style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px", display: "flex", gap: "32px", justifyContent: "center", alignItems: "center", minHeight: "50px" }}>
              <Link href="/" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text)", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--brand)"} onMouseOut={e => e.currentTarget.style.color = "var(--text)"}>Home</Link>
              <Link href="/about-us" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text)", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--brand)"} onMouseOut={e => e.currentTarget.style.color = "var(--text)"}>About Us</Link>
              
              {/* Disciplines Clickable Dropdown */}
              <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }} ref={disciplinesDropdownRef}>
                <button 
                  onClick={() => setOpenDropdown(openDropdown === "disciplines" ? null : "disciplines")}
                  style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: openDropdown === "disciplines" ? "var(--brand)" : "var(--text)", textDecoration: "none", fontFamily: "Outfit, sans-serif", display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s", padding: 0 }}
                  onMouseOver={e => e.currentTarget.style.color = "var(--brand)"} 
                  onMouseOut={e => e.currentTarget.style.color = openDropdown === "disciplines" ? "var(--brand)" : "var(--text)"}
                >
                  Browse Disciplines
                  {totalJournals > 0 ? (
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--brand)", background: "var(--accent-glow)", borderRadius: "999px", padding: "2px 8px" }}>
                      {totalJournals}
                    </span>
                  ) : null}
                  <span style={{ fontSize: "10px", transform: openDropdown === "disciplines" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                
                {openDropdown === "disciplines" && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: "900px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "16px", boxShadow: "var(--shadow-md)", padding: "24px", zIndex: 100 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                      {domains.map((d) => (
                        <Link key={d.domain} href={`/product-category/journals/${encodeURIComponent(d.domain)}`} onClick={() => setOpenDropdown(null)} style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", color: "var(--text)", fontSize: "14px", fontWeight: "500", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-soft)", transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "var(--accent-glow)"; e.currentTarget.style.color = "var(--brand)";}} onMouseOut={e => {e.currentTarget.style.background = "var(--surface-soft)"; e.currentTarget.style.color = "var(--text)";}}>
                          {d.domain} <span style={{ fontSize: "12px", color: "var(--muted)", background: "var(--surface)", padding: "2px 8px", borderRadius: "99px" }}>{d.count}</span>
                        </Link>
                      ))}
                    </div>
                    <div style={{ marginTop: "24px", textAlign: "center" }}>
                      <Link href="/catalogues-list" onClick={() => setOpenDropdown(null)} style={{ background: "var(--brand)", color: "white", padding: "10px 24px", borderRadius: "99px", textDecoration: "none", fontSize: "14px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        View Full Catalog
                        {totalJournals > 0 ? <span style={{ background: "rgba(255,255,255,0.18)", padding: "2px 8px", borderRadius: "999px", fontSize: "11px" }}>{totalJournals}</span> : null}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/books" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text)", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--brand)"} onMouseOut={e => e.currentTarget.style.color = "var(--text)"}>Books</Link>
              <Link href="/for-librarians" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text)", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--brand)"} onMouseOut={e => e.currentTarget.style.color = "var(--text)"}>For Librarians</Link>
              <Link href="/for-agencies" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text)", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--brand)"} onMouseOut={e => e.currentTarget.style.color = "var(--text)"}>For Agencies</Link>
              <Link href="/get-proforma-invoice-quote" style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent)", textDecoration: "none", fontFamily: "Outfit, sans-serif", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--accent-glow)"} onMouseOut={e => e.currentTarget.style.color = "var(--accent)"}>Get Proforma/Quote</Link>
            </nav>
          </div>
        </header>
      ) : null}

      {children}

      {!hideChrome ? <PublicChatbot /> : null}
      {!hideChrome ? <CookieConsentBanner /> : null}

      {!hideChrome ? (
        <footer className="site-footer" style={{ background: "#060a11", color: "#8b9ebd", paddingTop: "50px", paddingBottom: "20px", marginTop: "40px", fontFamily: "Arial, sans-serif" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "40px" }}>
            
            {/* Column 1: Company Info */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Link href="/" style={{ display: "inline-block", backgroundColor: "#ffffff", padding: "6px 12px", borderRadius: "6px", marginBottom: "16px" }}>
                <img src="/stmlogo.png" alt="STM Journals" style={{ height: "38px", display: "block", objectFit: "contain" }} />
              </Link>
              <p style={{ color: "#8b9ebd", fontSize: "12px", lineHeight: "1.6", marginBottom: "20px", maxWidth: "320px" }}>
                A premier global platform for scientific and medical research. An imprint of Consortium eLearning Network Pvt. Ltd. (Est. 2001).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", width: "100%" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "14px" }}>✉️</span>
                  <a href="mailto:subscriptions@stmjournals.com" style={{ color: "#8b9ebd", textDecoration: "none" }}>subscriptions@stmjournals.com</a>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", justifyContent: "center" }}>
                  <span style={{ fontSize: "14px", marginTop: "2px" }}>📞</span>
                  <div style={{ textAlign: "left" }}>
                    <a href="tel:+919810078958" style={{ color: "#8b9ebd", textDecoration: "none", display: "block" }}>+91-9810078958 (M)</a>
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
                <li><Link href="/catalogues" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>📄</span> Department Catalogs</Link></li>
              </ul>
            </div>

            {/* Column 3: PRICING & SUPPORT */}
            <div>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#3B82F6", marginBottom: "20px", textTransform: "uppercase", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>PRICING & SUPPORT</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                <li><Link href="/catalogues?currency=INR" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🏷️</span> Pricing List (INR)</Link></li>
                <li><Link href="/catalogues?currency=USD" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🌐</span> International Pricing (USD)</Link></li>
                <li><Link href="/contact-us" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>💬</span> Contact Support</Link></li>
                <li><Link href="/faq" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>⏱️</span> FAQ Center</Link></li>
                <li><Link href="/shipping-delivery-policy" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🚚</span> Shipping & Delivery</Link></li>
                <li><Link href="/policies" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>📄</span> Editorial Policies</Link></li>
                <li><Link href="/terms-and-conditions" style={{ color: "#8b9ebd", textDecoration: "none", fontSize: "12px", display: "flex", alignItems: "center", gap: "10px" }}><span>🏛️</span> Terms of Service</Link></li>
              </ul>
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

      {/* Semi-transparent Overlay */}
      {isCartDrawerOpen && (
        <div 
          onClick={() => setIsCartDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            transition: "opacity 0.3s ease"
          }}
        />
      )}

      {/* Cart Drawer Panel */}
      <div 
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(400px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          transform: isCartDrawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Outfit, sans-serif"
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
            🛒 Cart ({count})
          </h2>
          <button 
            onClick={() => setIsCartDrawerOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer Body (Scrollable List) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", textAlign: "center", color: "var(--muted)" }}>
              <span style={{ fontSize: "40px" }}>🛍️</span>
              <p style={{ margin: 0, fontSize: "14px" }}>Your cart is empty.</p>
              <button 
                onClick={() => setIsCartDrawerOpen(false)}
                style={{
                  background: "var(--brand)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((it) => {
              const lowerName = (it.journalName || "").toLowerCase();
              const lowerSubject = (it.subject || "").toLowerCase();
              const isBook =
                lowerSubject.includes("book") ||
                lowerSubject.includes("monograph") ||
                lowerSubject.includes("nstc") ||
                lowerName.includes("book") ||
                lowerName.includes("monograph") ||
                lowerName.includes("handbook") ||
                lowerName.includes("textbook");
              const itemHsn = it.plan === "ONLINE" ? "998431" : isBook ? "4901" : "4902";

              return (
                <div key={it.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
                  <img 
                    src={it.image} 
                    alt={it.journalName} 
                    style={{ width: "60px", height: "76px", objectFit: "contain", borderRadius: "4px", border: "1px solid var(--line)", background: "var(--surface-soft)" }} 
                  />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "700", color: "var(--text)", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {it.journalName}
                      </h4>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)" }}>
                        {it.plan.replace("_", " + ")} | Year {it.year}{it.issue ? ` | Issue ${it.issue}` : ""}
                      </p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--brand)", fontWeight: "700" }}>
                        {money(it.unitPrice)} <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: "normal", marginLeft: "6px" }}>HSN: {itemHsn}</span>
                      </p>
                    </div>
                    
                    {/* Qty controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: "6px", background: "var(--surface-soft)", overflow: "hidden" }}>
                        <button 
                          onClick={() => setQty(it.id, it.qty - 1)}
                          style={{ border: "none", background: "none", width: "24px", height: "24px", cursor: "pointer", color: "var(--text)", fontWeight: "bold" }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: "12px", minWidth: "20px", textAlign: "center", fontWeight: "700", color: "var(--text)" }}>{it.qty}</span>
                        <button 
                          onClick={() => setQty(it.id, it.qty + 1)}
                          style={{ border: "none", background: "none", width: "24px", height: "24px", cursor: "pointer", color: "var(--text)", fontWeight: "bold" }}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(it.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px", borderTop: "1px solid var(--line)", background: "var(--surface-soft)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted)" }}>
                <span>Subtotal:</span>
                <strong style={{ color: "var(--text)" }}>{money(subtotal)}</strong>
              </div>
              
              {/* Coupon Field */}
              <div style={{ display: "flex", gap: "8px", margin: "4px 0" }}>
                <input 
                  value={drawerCoupon} 
                  onChange={(e) => setDrawerCoupon(e.target.value)} 
                  placeholder="Promo code" 
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px", outline: "none", background: "var(--surface)", color: "var(--text)" }} 
                />
                <button 
                  onClick={applyDrawerCoupon}
                  style={{ background: "var(--brand)", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Apply
                </button>
              </div>
              {drawerCouponMsg && (
                <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: drawerCouponMsg.includes("Applied") ? "#16a34a" : "#ef4444", fontWeight: "600" }}>
                  {drawerCouponMsg}
                </p>
              )}

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>
                  <span>Discount {couponCode ? `(${couponCode})` : ""}:</span>
                  <span>-{money(discount)}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", borderTop: "1px dashed var(--line)", paddingTop: "10px", marginTop: "4px" }}>
                <span style={{ color: "var(--text)" }}>Total:</span>
                <strong style={{ color: "var(--brand)", fontSize: "16px" }}>{money(total)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link 
                href="/checkout" 
                onClick={() => setIsCartDrawerOpen(false)}
                style={{
                  width: "100%",
                  background: "var(--brand)",
                  color: "#ffffff",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px var(--accent-glow)"
                }}
              >
                Proceed to Checkout
              </Link>
              <Link 
                href="/cart" 
                onClick={() => setIsCartDrawerOpen(false)}
                style={{
                  width: "100%",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  color: "var(--text)",
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none"
                }}
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating Sticky Cart Button */}
      {!hideChrome && !isCartDrawerOpen && count > 0 && (
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          style={{
            position: "fixed",
            right: "20px",
            bottom: "92px",
            zIndex: 998,
            background: "var(--brand)",
            color: "#ffffff",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            outline: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1) translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 28px rgba(15, 23, 42, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 23, 42, 0.3)";
          }}
        >
          <svg style={{ width: "24px", height: "24px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "var(--accent)",
            color: "white",
            borderRadius: "50%",
            width: "22px",
            height: "22px",
            fontSize: "11px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
          }}>
            {count}
          </span>
        </button>
      )}
    </>
  );
}
