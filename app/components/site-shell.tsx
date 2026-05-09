"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/components/cart-store";
import { useEffect, useState } from "react";

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

  return (
    <>
      {!hideChrome ? (
        <header className="site-header site-main-header" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="site-topbar" style={{
            padding: "16px 20px",
            background: "#ffffff",
            display: "grid",
            gridTemplateColumns: "250px 1fr 220px",
            alignItems: "center",
            gap: "24px"
          }}>
            <Link href="/" className="site-brand" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: "900",
              fontSize: "24px",
              letterSpacing: "0.04em",
              color: "#0F172A",
              textDecoration: "none"
            }}>
              <span style={{ color: "#F59E0B" }}>STM</span> JOURNALS
            </Link>
            
            {/* Minimalist Search Bar with Dual-Ring styling */}
            <div className="site-search" style={{ position: "relative", maxWidth: "600px", width: "100%", justifySelf: "center" }}>
              <input
                type="text"
                placeholder="Search Journal, Book or ISSN..."
                aria-label="Search Journal, Book or ISSN"
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  borderRadius: "4px",
                  border: "1px solid #E2E8F0",
                  outline: "none",
                  fontSize: "14px",
                  fontFamily: "Outfit, sans-serif",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: "#F8FAFC"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#F59E0B";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.15)";
                  e.currentTarget.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
              />
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "15px" }}>🔍</span>
            </div>

            <div className="site-utils" style={{ display: "flex", gap: "16px", justifyContent: "flex-end", alignItems: "center" }}>
              {user ? (
                <a href="/api/auth/logout" style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>Logout</a>
              ) : (
                <Link href="/login" style={{ fontSize: "13px", fontWeight: "600", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>Login</Link>
              )}
              <Link href="/cart" style={{
                background: "#0F172A",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                fontFamily: "Outfit, sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <svg style={{ width: "15px", height: "15px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                My Cart{count > 0 ? ` (${count})` : ""}
              </Link>
            </div>
          </div>
          
          <div className="site-header-inner" style={{ padding: "10px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
            <nav className="site-nav" style={{ display: "flex", gap: "24px", justifyContent: "center", alignItems: "center" }}>
              <Link href="/" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>Home</Link>
              <Link href="/about-us" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>About US</Link>
              <div className="site-disciplines-menu" style={{ position: "relative" }}>
                <a href="/catalogues-list" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Browse All Disciplines
                  <span style={{ fontSize: "10px" }}>▼</span>
                </a>
                <div className="site-disciplines-dropdown">
                  {domains.map((d) => (
                    <a key={d.domain} href={`/product-category/journals/${encodeURIComponent(d.domain)}`}>
                      {d.domain} ({d.count})
                    </a>
                  ))}
                  <a className="site-disciplines-catalog-btn" href="/catalogues-list">View full Catalog</a>
                </div>
              </div>
              <Link href="/books" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>Books</Link>
              <Link href="/for-librarians" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>For Librarians</Link>
              <Link href="/for-agencies" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>For Agencies</Link>
              <Link href="/get-proforma-invoice-quote" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#F59E0B", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>Get Proforma/Quote</Link>
              <div className="site-account-menu">
                <Link href={user ? "/account" : "/login"} style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em", color: "#334155", textDecoration: "none", fontFamily: "Outfit, sans-serif" }}>My Account</Link>
                {user ? (
                  <div className="site-account-dropdown">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <a href="/account">Account Details</a>
                    {user.role === "ADMIN" ? <a href="/admin">Admin Dashboard</a> : null}
                    <a href="/api/auth/logout">Logout</a>
                  </div>
                ) : null}
              </div>
            </nav>
          </div>
        </header>
      ) : null}

      {children}

      {!hideChrome ? (
        <footer className="site-footer">
          <p>Consortium e-Learning Network Pvt. Ltd. - STM Journals</p>
        </footer>
      ) : null}
    </>
  );
}
