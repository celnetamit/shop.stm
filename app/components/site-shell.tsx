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
        <header className="site-header site-main-header">
          <div className="site-topbar">
            <Link href="/" className="site-brand">
              <span className="site-brand-stm">STM</span> <span className="site-brand-journals">JOURNALS</span>
            </Link>
            <div className="site-search">
              <input type="text" placeholder="Search Journal, Book or ISSN..." aria-label="Search Journal, Book or ISSN" />
              <button type="button" aria-label="Search">🔍</button>
            </div>
            <div className="site-utils">
              {user ? <a href="/api/auth/logout">Logout</a> : <Link href="/login">Login</Link>}
              <Link href="/cart">My Cart{count > 0 ? ` (${count})` : ""}</Link>
            </div>
          </div>
          <div className="site-header-inner">
            <nav className="site-nav">
              <Link href="/">Home</Link>
              <Link href="/about-us">About US</Link>
              <div className="site-disciplines-menu">
                <a href="/catalogues-list">Browse All Disciplines</a>
                <div className="site-disciplines-dropdown">
                  {domains.map((d) => (
                    <a key={d.domain} href={`/product-category/journals/${encodeURIComponent(d.domain)}`}>
                      {d.domain} ({d.count})
                    </a>
                  ))}
                  <a className="site-disciplines-catalog-btn" href="/catalogues-list">View full Catalog</a>
                </div>
              </div>
              <Link href="/books">Books</Link>
              <Link href="/for-librarians">For Librarians</Link>
              <Link href="/for-agencies">For Agencies</Link>
              <Link href="/get-proforma-invoice-quote">Get Proforma/Quote</Link>
              <div className="site-account-menu">
                <Link href={user ? "/account" : "/login"}>My Account</Link>
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
