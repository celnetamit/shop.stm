"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterRole = "LIBRARIAN" | "AGENCY" | "USER" | "STUDENT" | "SCHOLAR";
const ACADEMIC_ROLES: RegisterRole[] = ["LIBRARIAN", "STUDENT", "SCHOLAR", "USER"];

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("LIBRARIAN");
  const [error, setError] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeAddress, setCollegeAddress] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailVerified = Boolean(
    (verifiedEmail && verifiedEmail === normalizedEmail) ||
    (typeof window !== "undefined" && window.localStorage.getItem("otp_verified_email") === normalizedEmail)
  );

  function onEmailChange(value: string) {
    setEmail(value);
    setOtp("");
    setError("");
    setSuccess("");
    if (value.trim().toLowerCase() !== verifiedEmail) {
      setVerifiedEmail("");
    }
  }

  async function sendOtp() {
    setError("");
    setSuccess("");
    setSendingOtp(true);

    try {
      const res = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; verified?: boolean };

      if (!json.ok) {
        setError(json.error || "Could not send OTP.");
        return;
      }

      if (json.verified) {
        setVerifiedEmail(normalizedEmail);
        setSuccess("Email already verified. You can create your account.");
        if (typeof window !== "undefined") {
          window.localStorage.setItem("otp_verified_email", normalizedEmail);
        }
        return;
      }

      setSuccess("OTP sent. Check your email and enter the 6 digit code.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setSuccess("");
    setVerifyingOtp(true);

    try {
      const res = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; verified?: boolean };

      if (!json.ok || !json.verified) {
        setError(json.error || "Could not verify OTP.");
        return;
      }

      setVerifiedEmail(normalizedEmail);
      setSuccess("Email verified. Complete the details below.");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("otp_verified_email", normalizedEmail);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isEmailVerified) {
      setError("Please verify your email with OTP before creating an account.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email: normalizedEmail, password, role, collegeName, collegeAddress })
      });

      const json = (await res.json()) as { ok: boolean; error?: string; user?: { role: "USER" | "ADMIN" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR" } };

      if (!json.ok || !json.user) {
        setError(json.error || "Registration failed");
        return;
      }

      setSuccess("Registration successful. Please log in with your new account.");
      router.push("/login?registered=1");
      router.refresh();
    } catch {
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
      {success ? <p className="auth-success">{success}</p> : null}
      <a className="auth-google" href="/api/auth/google/start" aria-label="Continue with Google">
        <svg className="google-logo" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continue with Google
      </a>
      <p className="auth-divider">or verify email to register</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="register-field-label">Email Address</label>
        <div className="register-email-row">
          <input value={email} onChange={(e) => onEmailChange(e.target.value)} type="email" placeholder="you@institution.edu" required disabled={loading} />
          <button className="register-otp-btn" type="button" onClick={sendOtp} disabled={sendingOtp || !normalizedEmail || isEmailVerified}>
            {isEmailVerified ? "Verified" : sendingOtp ? "Sending..." : "Send OTP"}
          </button>
        </div>
        {!isEmailVerified ? (
          <div className="register-otp-panel">
            <label className="register-field-label">Email OTP</label>
            <div className="register-email-row">
              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6 digit code" />
              <button className="register-otp-btn" type="button" onClick={verifyOtp} disabled={verifyingOtp || otp.length !== 6}>
                {verifyingOtp ? "Checking..." : "Verify"}
              </button>
            </div>
          </div>
        ) : null}
        <label className="register-field-label">Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Name (optional)" disabled={!isEmailVerified} />
        <label className="register-field-label">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Minimum 8 characters" required minLength={8} disabled={!isEmailVerified} />
        <label className="register-field-label">Designation</label>
        <select value={role} onChange={(e) => setRole(e.target.value as RegisterRole)} required disabled={!isEmailVerified}>
          <option value="LIBRARIAN">Librarian</option>
          <option value="AGENCY">Agency</option>
          <option value="USER">College / Institution</option>
          <option value="SCHOLAR">Scholar / Student</option>
        </select>
        {ACADEMIC_ROLES.includes(role) ? (
          <>
            <label className="register-field-label">College Name</label>
            <input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} type="text" placeholder="College / Institution Name" disabled={!isEmailVerified} />
            <label className="register-field-label">College Address</label>
            <input value={collegeAddress} onChange={(e) => setCollegeAddress(e.target.value)} type="text" placeholder="College Address" disabled={!isEmailVerified} />
          </>
        ) : null}
        <button className="auth-btn register-submit-btn" type="submit" disabled={loading || !isEmailVerified}>{loading ? "Creating..." : "Create Account"}</button>
      </form>
      <p className="register-foot">Already have an account? <Link href="/login">Login</Link></p>
    </div>
  );
}
