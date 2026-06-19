"use client";

import { useEffect, useState } from "react";
import { fetchPrefillUser, loadDraft, saveDraft } from "@/lib/client/form-prefill";

export default function ForAgenciesPage() {
  const [formData, setFormData] = useState({
    agencyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    country: "",
    website: "",
    specialization: "Science",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email verification state variables
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const normalizedEmail = formData.email.trim().toLowerCase();
  const isEmailVerified = Boolean(
    (verifiedEmail && verifiedEmail === normalizedEmail) ||
    (typeof window !== "undefined" && window.localStorage.getItem("otp_verified_email") === normalizedEmail)
  );

  function handleEmailChange(val: string) {
    setFormData(p => ({ ...p, email: val }));
    setOtp("");
    setOtpError(null);
    setOtpMessage(null);
    if (val.trim().toLowerCase() !== verifiedEmail) {
      setVerifiedEmail("");
    }
  }

  async function sendOtp() {
    setOtpError(null);
    setOtpMessage(null);
    setSendingOtp(true);

    try {
      const res = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; verified?: boolean };

      if (!json.ok) {
        setOtpError(json.error || "Could not send OTP.");
        return;
      }

      if (json.verified) {
        setVerifiedEmail(normalizedEmail);
        setOtpMessage("Email already verified. You can submit the form.");
        if (typeof window !== "undefined") {
          window.localStorage.setItem("otp_verified_email", normalizedEmail);
        }
        return;
      }

      setOtpSent(true);
      setOtpMessage("OTP sent. Check your email and enter the 6 digit code.");
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    setOtpError(null);
    setOtpMessage(null);
    setVerifyingOtp(true);

    try {
      const res = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp })
      });
      const json = (await res.json()) as { ok: boolean; error?: string; verified?: boolean };

      if (!json.ok || !json.verified) {
        setOtpError(json.error || "Could not verify OTP.");
        return;
      }

      setVerifiedEmail(normalizedEmail);
      setOtpMessage("Email verified successfully!");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("otp_verified_email", normalizedEmail);
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  useEffect(() => {
    const draft = loadDraft<typeof formData>("draft:for-agencies");
    if (Object.keys(draft).length) {
      setFormData((prev) => ({ ...prev, ...draft }));
    }
    (async () => {
      const u = await fetchPrefillUser();
      if (!u) return;
      setFormData((prev) => ({
        ...prev,
        contactPerson: prev.contactPerson || u.name || prev.contactPerson,
        email: prev.email || u.email || prev.email
      }));
      if (u.email) {
        setVerifiedEmail(u.email.trim().toLowerCase());
      }
    })();
  }, []);

  useEffect(() => {
    saveDraft("draft:for-agencies", formData);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) {
      setError("Please verify your email address using the OTP first.");
      return;
    }
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/agency-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(true);
      setFormData((prev) => ({ ...prev, message: "" }));
    } catch (err: any) {
      setError(err.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  };

  const partnerBenefits = [
    {
      icon: "📚",
      title: "High-Quality Peer-Reviewed Content",
      desc: "Offer your clients access to over 457 leading journals across scientific, engineering, biomedical, and multidisciplinary streams."
    },
    {
      icon: "🌍",
      title: "Global Academic Recognition",
      desc: "Distribute journals indexed in premier research databases, ensuring high credibility and impact for subscribing libraries."
    },
    {
      icon: "💰",
      title: "Competitive Trade Discounts",
      desc: "Gain access to attractive distributor pricing, high trade margins, and flexible institutional licensing schemes."
    },
    {
      icon: "📣",
      title: "Extensive Marketing Support",
      desc: "Equip your sales force with printed brochures, digital catalogues, customizable banners, and promotional toolkits."
    },
    {
      icon: "🤝",
      title: "Dedicated Account Management",
      desc: "Work with a designated distributor coordinator to speed up your quotes, invoice generation, and claims verification."
    },
    {
      icon: "⚙️",
      title: "Simplified Logistics & EDI",
      desc: "Consolidated shipments, single-point invoicing, and API data capabilities for direct catalog synchronization."
    }
  ];

  return (
    <main className="for-agencies-container" style={{
      maxWidth: "900px",
      margin: "40px auto",
      padding: "0 20px",
      fontFamily: "Outfit, sans-serif"
    }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "45px" }}>
        <span style={{
          background: "rgba(59, 130, 246, 0.1)",
          color: "#2563EB",
          fontSize: "12px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "6px 14px",
          borderRadius: "9999px",
          display: "inline-block",
          marginBottom: "16px",
        }}>
          Global Distribution Network
        </span>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "38px",
          color: "#0F172A",
          marginBottom: "12px"
        }}>
          Partner with STM Journals
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#475569",
          lineHeight: "1.7",
          maxWidth: "650px",
          margin: "0 auto"
        }}>
          Join our global ecosystem of subscription agents and library vendors to distribute world-class research. Provide your institutional clients with premium content, custom collections, and flexible purchasing terms.
        </p>
      </div>

      {/* Section 1: Core Benefits Grid */}
      <section style={{ marginBottom: "50px" }}>
        <h2 style={{ 
          fontSize: "22px", 
          fontFamily: "'Playfair Display', serif", 
          color: "#0F172A", 
          textAlign: "center", 
          marginBottom: "28px",
          fontWeight: "700"
        }}>
          Benefits of Becoming Our Distribution Partner
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px"
        }}>
          {partnerBenefits.map((item, i) => (
            <div key={i} style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "24px",
              transition: "box-shadow 0.2s ease",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <span style={{ fontSize: "28px" }}>{item.icon}</span>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: "14px", color: "#64748B", lineHeight: "1.5", margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: The Onboarding Workflow */}
      <section style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        padding: "32px 24px",
        marginBottom: "50px"
      }}>
        <h2 style={{ 
          fontSize: "22px", 
          fontFamily: "'Playfair Display', serif", 
          color: "#0F172A", 
          textAlign: "center", 
          marginBottom: "30px",
          fontWeight: "700" 
        }}>
          How to Get Started
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          textAlign: "center"
        }}>
          {[
            { step: "1", title: "Apply", desc: "Submit the Agency Inquiry & Registration form below." },
            { step: "2", title: "Verification", desc: "Our Relations desk will verify your firm credentials." },
            { step: "3", title: "Negotiate", desc: "Discuss regional territories, pricing tiers, and agreements." },
            { step: "4", title: "Distribute", desc: "Access our API / MARC catalogs and begin fulfilling client needs." }
          ].map((s, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <div style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                background: "#2563EB",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px"
              }}>
                {s.step}
              </div>
              <h4 style={{ fontSize: "16px", color: "#0F172A", fontWeight: "700", margin: "0 0 6px 0" }}>{s.title}</h4>
              <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.5", margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Territory Availability */}
      <section style={{
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        padding: "24px",
        marginBottom: "50px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "#FFFFFF"
      }}>
        <h3 style={{ fontSize: "18px", color: "#0F172A", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          🗺️ Worldwide Opportunities
        </h3>
        <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
          We currently support and welcome distribution inquiries across all major global markets, including **North America**, **Europe**, **Asia**, **Latin America**, **Africa**, and **Oceania**. Our physical distributions comply with standard ISO workflows, while our digital deliverables support modern authentication schemes.
        </p>
      </section>

      {/* Section 4: Registration Form Card */}
      <section style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
        padding: "35px"
      }} id="agency-form">
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "24px",
          fontWeight: "700",
          color: "#0F172A",
          marginBottom: "8px"
        }}>
          Agency Registration & Inquiry
        </h2>
        <p style={{ color: "#64748B", fontSize: "15px", marginBottom: "28px" }}>
          Provide your firm specifics below, and our distributor support queue will reach out within 48 hours.
        </p>

        {success && (
          <div style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "15px",
            fontWeight: "500",
            marginBottom: "24px",
          }}>
            ✅ Registration request submitted successfully! We will process your verification details and email you shortly.
          </div>
        )}

        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "15px",
            fontWeight: "500",
            marginBottom: "24px",
          }}>
            ⚠️ Error submitting enquiry: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Agency / Company Name *</label>
              <input
                type="text"
                required
                value={formData.agencyName}
                onChange={(e) => setFormData(p => ({ ...p, agencyName: e.target.value }))}
                placeholder="e.g. Global Periodicals Inc."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "15px",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Primary Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData(p => ({ ...p, contactPerson: e.target.value }))}
                placeholder="e.g. John Smith"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "15px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Business Email Address *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. info@agencydomain.com"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "15px",
                    outline: "none",
                    background: isEmailVerified ? "#F1F5F9" : "#FFFFFF"
                  }}
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={sendingOtp || !normalizedEmail || isEmailVerified}
                  style={{
                    padding: "0 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: isEmailVerified ? "#10B981" : "#2563EB",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: (sendingOtp || !normalizedEmail || isEmailVerified) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s"
                  }}
                >
                  {isEmailVerified ? "Verified ✓" : sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </div>
              {otpError && (
                <p style={{ color: "#EF4444", fontSize: "13px", marginTop: "6px", marginBottom: 0 }}>
                  ⚠️ {otpError}
                </p>
              )}
              {otpMessage && (
                <p style={{ color: isEmailVerified ? "#10B981" : "#2563EB", fontSize: "13px", marginTop: "6px", marginBottom: 0 }}>
                  {isEmailVerified ? "✓" : "ℹ️"} {otpMessage}
                </p>
              )}
              {!isEmailVerified && otpSent && (
                <div style={{ marginTop: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Enter 6-Digit Email OTP *</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6 digit code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                      style={{
                        padding: "0 20px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#0F172A",
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: (verifyingOtp || otp.length !== 6) ? "not-allowed" : "pointer"
                      }}
                    >
                      {verifyingOtp ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Phone / Whatsapp Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. +1-555-0199"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "15px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Country / Region *</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))}
                placeholder="e.g. Australia, UK, Canada"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "15px",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Website / Tax Registry URL</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))}
                placeholder="e.g. https://www.agencyportal.com"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "15px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Primary Acquisition Focus *</label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "15px",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="Science">Scientific (Pure & Applied Sciences)</option>
              <option value="Technology">Technological & Engineering</option>
              <option value="Medicine">Medical & Pharmacy Sciences</option>
              <option value="Multidisciplinary">Multidisciplinary & Hybrid Fields</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Message / Territory Notes</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
              placeholder="Share details about your agency's reach, current client base, or specific collection volumes you operate."
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "15px",
                outline: "none",
                resize: "vertical",
                fontFamily: "Outfit, sans-serif"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isEmailVerified}
            style={{
              width: "100%",
              background: (!isEmailVerified || loading) ? "#94A3B8" : "#2563EB",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              fontWeight: "700",
              fontSize: "16px",
              cursor: (loading || !isEmailVerified) ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "10px"
            }}
            onMouseEnter={(e) => {
              if (!loading && isEmailVerified) e.currentTarget.style.background = "#1D4ED8";
            }}
            onMouseLeave={(e) => {
              if (!loading && isEmailVerified) e.currentTarget.style.background = "#2563EB";
            }}
          >
            {loading ? "Registering..." : "Submit Agency Registration Request"}
          </button>
        </form>
      </section>
    </main>
  );
}
