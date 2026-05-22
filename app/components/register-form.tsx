"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterRole = "LIBRARIAN" | "AGENCY" | "USER" | "STUDENT" | "SCHOLAR";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("LIBRARIAN");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });

      const json = (await res.json()) as { ok: boolean; error?: string; user?: { role: "USER" | "ADMIN" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR" } };

      if (!json.ok || !json.user) {
        setError(json.error || "Registration failed");
        return;
      }

      setSuccess("Registration successful. Please log in with your new account.");
      router.push("/login?registered=1");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card register-card">
      <div className="register-head">
        <h1>Create Account</h1>
        <p>Join STM Journals and manage quotes, subscriptions, and invoices in one place.</p>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p style={{ color: "#166534", fontSize: "14px" }}>{success}</p> : null}
      <a className="auth-google" href="/api/auth/google/start">Continue with Google</a>
      <p className="auth-divider">or create with email</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="register-field-label">Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Name (optional)" />
        <label className="register-field-label">Email Address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@institution.edu" required />
        <label className="register-field-label">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Minimum 8 characters" required minLength={8} />
        <label className="register-field-label">Register As</label>
        <select value={role} onChange={(e) => setRole(e.target.value as RegisterRole)} required>
          <option value="LIBRARIAN">Librarian</option>
          <option value="AGENCY">Agency</option>
          <option value="USER">College / Institution</option>
          <option value="SCHOLAR">Scholar / Student</option>
        </select>
        <button className="auth-btn register-submit-btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
      </form>
      <p className="register-foot">Already have an account? <Link href="/login">Login</Link></p>
    </div>
  );
}
