"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const json = (await res.json()) as { ok: boolean; error?: string; user?: { role: "USER" | "ADMIN" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR" } };

      if (!json.ok || !json.user) {
        setError(json.error || "Login failed");
        return;
      }

      router.push(json.user.role === "ADMIN" ? "/admin" : "/");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: "440px",
      width: "100%",
      background: "white",
      borderRadius: "24px",
      boxShadow: "0 20px 40px -8px rgba(0,0,0,0.08), 0 10px 16px -6px rgba(0,0,0,0.02)",
      padding: "48px",
      fontFamily: "Outfit, sans-serif",
      border: "1px solid #F1F5F9"
    }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ 
          width: "56px", 
          height: "56px", 
          background: "#EFF6FF", 
          borderRadius: "16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 20px" 
        }}>
          <svg style={{ width: "28px", height: "28px", color: "#2563EB" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>Welcome Back</h1>
        <p style={{ color: "#64748B", fontSize: "15px", margin: 0 }}>Sign in to continue to STM Journals.</p>
      </div>

      {searchParams.get("error") && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#B91C1C", fontSize: "14px", marginBottom: "24px", textAlign: "center" }}>
          Google sign-in failed. Please try again.
        </div>
      )}
      {searchParams.get("registered") === "1" && (
        <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: "12px", color: "#166534", fontSize: "14px", marginBottom: "24px", textAlign: "center" }}>
          Registration completed. Please sign in with your new account.
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#B91C1C", fontSize: "14px", marginBottom: "24px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            type="email" 
            placeholder="Email address" 
            required 
            style={{
              width: "100%",
              padding: "14px 16px 14px 48px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              fontSize: "15px",
              fontFamily: "inherit",
              outline: "none",
              transition: "all 0.2s",
              background: "#F8FAFC"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3B82F6";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
              e.currentTarget.style.background = "white";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#F8FAFC";
            }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            placeholder="Password" 
            required 
            style={{
              width: "100%",
              padding: "14px 16px 14px 48px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              fontSize: "15px",
              fontFamily: "inherit",
              outline: "none",
              transition: "all 0.2s",
              background: "#F8FAFC"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3B82F6";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.1)";
              e.currentTarget.style.background = "white";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#F8FAFC";
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: "#0F172A",
            color: "white",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "8px"
          }}
          onMouseOver={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseOut={e => !loading && (e.currentTarget.style.transform = "translateY(0)")}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }}></div>
        <span style={{ color: "#94A3B8", fontSize: "13px" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }}></div>
      </div>

      <a 
        href="/api/auth/google/start"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          background: "white",
          color: "#475569",
          textDecoration: "none",
          fontSize: "15px",
          fontWeight: "600",
          transition: "all 0.2s",
          marginBottom: "24px"
        }}
        onMouseOver={e => e.currentTarget.style.background = "#F8FAFC"}
        onMouseOut={e => e.currentTarget.style.background = "white"}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.043.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </a>

      <p style={{ margin: 0, textAlign: "center", color: "#64748B", fontSize: "14px" }}>
        Don't have an account? <Link href="/register" style={{ color: "#2563EB", fontWeight: "600", textDecoration: "none" }}>Sign up</Link>
      </p>
    </div>
  );
}
