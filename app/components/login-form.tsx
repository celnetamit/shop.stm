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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const json = (await res.json()) as { ok: boolean; error?: string; user?: { role: "USER" | "ADMIN" } };

    setLoading(false);
    if (!json.ok || !json.user) {
      setError(json.error || "Login failed");
      return;
    }

    router.push(json.user.role === "ADMIN" ? "/admin" : "/");
    router.refresh();
  }

  return (
    <div className="auth-card login-card">
      <h1>Login</h1>
      <p className="login-subtitle">Sign in to continue to STM Journals.</p>
      {searchParams.get("error") ? <p className="auth-error">Google sign-in failed. Please try again.</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      <form className="auth-form" onSubmit={onSubmit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
        <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      </form>
      <a className="auth-google" href="/api/auth/google/start">Continue with Google</a>
      <p className="login-footer">New user? <Link href="/register">Create an account</Link></p>
    </div>
  );
}
