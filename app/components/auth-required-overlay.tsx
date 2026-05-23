"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  show: boolean;
  title?: string;
  subtitle?: string;
};

export default function AuthRequiredOverlay({ show, title = "Login Required", subtitle = "Please login to continue." }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!show) return null;

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; user?: { role: string } };
      if (!json.ok || !json.user) {
        setError(json.error || "Login failed.");
        return;
      }
      router.refresh();
      router.push(json.user.role === "ADMIN" ? "/admin" : "/account");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.38)", backdropFilter: "blur(6px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "420px", borderRadius: "16px", border: "1px solid #dbe3f1", background: "#fff", boxShadow: "0 24px 40px rgba(2, 12, 27, 0.18)", padding: "22px", position: "relative" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Close and go to home"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "30px",
            height: "30px",
            borderRadius: "999px",
            border: "1px solid #dbe3f1",
            background: "#f8fafc",
            color: "#475569",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: "1"
          }}
        >
          ×
        </button>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", color: "#0f172a" }}>{title}</h2>
        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>{subtitle}</p>

        {error ? <p style={{ color: "#b91c1c", fontSize: "13px", margin: "0 0 12px 0" }}>{error}</p> : null}

        <form onSubmit={onLogin} style={{ display: "grid", gap: "10px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 12px", fontSize: "14px" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 12px", fontSize: "14px" }}
          />
          <button type="submit" disabled={loading} style={{ border: "none", borderRadius: "10px", background: "#1d4ed8", color: "#fff", padding: "10px 12px", fontWeight: 700, cursor: "pointer" }}>
            {loading ? "Signing in..." : "Login"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              background: "#fff",
              color: "#0f172a",
              padding: "10px 12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Back to Home
          </button>
        </form>

        <p style={{ margin: "14px 0 0 0", fontSize: "13px", color: "#475569" }}>
          New user? <Link href="/register" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
