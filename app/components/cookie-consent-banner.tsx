"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "stm_cookie_consent_v1";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    setVisible(!saved);
  }, []);

  function saveConsent(value: "accepted" | "rejected") {
    window.localStorage.setItem(KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9997, background: "rgba(15, 23, 42, 0.96)", color: "#e2e8f0", padding: "14px 16px", borderTop: "1px solid rgba(148,163,184,0.35)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.45 }}>
          We use cookies for essential functionality, analytics, and compliance with DPDP, GDPR, and SOC 2 practices.
          Read our <Link href="/privacy-policy" style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 700 }}>Privacy Policy</Link>.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => saveConsent("rejected")} style={{ border: "1px solid #64748b", background: "transparent", color: "#e2e8f0", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Reject</button>
          <button onClick={() => saveConsent("accepted")} style={{ border: "none", background: "#2563eb", color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Accept Cookies</button>
        </div>
      </div>
    </div>
  );
}
