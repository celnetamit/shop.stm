"use client";

import { useState } from "react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setFormData({
        agencyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        country: "",
        website: "",
        specialization: "Science",
        message: ""
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="for-agencies-container" style={{
      maxWidth: "800px",
      margin: "40px auto",
      padding: "0 20px"
    }}>
      {/* Editorial Header */}
      <div style={{ textAlign: "center", marginBottom: "35px" }}>
        <span style={{
          background: "rgba(245, 158, 11, 0.12)",
          color: "#F59E0B",
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "4px 10px",
          borderRadius: "9999px",
          display: "inline-block",
          marginBottom: "12px",
          fontFamily: "Inter, sans-serif"
        }}>
          Global Partnerships
        </span>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "32px",
          fontWeight: "800",
          color: "#0F172A",
          marginBottom: "12px"
        }}>
          Subscription Agency Partnership Program
        </h1>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "15px",
          color: "#64748b",
          lineHeight: "1.6",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          Partner with STM Journals to deliver world-class research to institutions globally. Complete our agency registration and inquiry form below to join our ecosystem.
        </p>
      </div>

      {/* Benefits section */}
      <div style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: "4px",
        padding: "24px",
        marginBottom: "35px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        <div>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Consortium Benefits</h4>
          <p style={{ margin: "0", fontSize: "13px", color: "#64748b", lineHeight: "1.5", fontFamily: "Inter, sans-serif" }}>Unlock competitive agency discounts and customizable multi-tier subscription plans.</p>
        </div>
        <div>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Single Dispatch</h4>
          <p style={{ margin: "0", fontSize: "13px", color: "#64748b", lineHeight: "1.5", fontFamily: "Inter, sans-serif" }}>Direct single-point delivery and tracking of scholarly journals worldwide.</p>
        </div>
        <div>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Priority Support</h4>
          <p style={{ margin: "0", fontSize: "13px", color: "#64748b", lineHeight: "1.5", fontFamily: "Inter, sans-serif" }}>Dedicated account manager and accelerated proforma invoicing quotes.</p>
        </div>
      </div>

      {/* Form Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
        padding: "35px 24px"
      }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "20px",
          fontWeight: "700",
          color: "#0F172A",
          marginBottom: "24px",
          borderBottom: "1px solid #F1F5F9",
          paddingBottom: "12px"
        }}>
          Agency Inquiry & Verification Form
        </h2>

        {success && (
          <div style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            borderRadius: "4px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "24px",
            fontFamily: "Inter, sans-serif"
          }}>
            ✓ Thank you! Your agency inquiry has been successfully submitted. Our team will review the details and contact you shortly.
          </div>
        )}

        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            borderRadius: "4px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "24px",
            fontFamily: "Inter, sans-serif"
          }}>
            ✗ Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px", fontFamily: "Inter, sans-serif" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Agency / Organization Name *</label>
              <input
                type="text"
                required
                value={formData.agencyName}
                onChange={(e) => setFormData(p => ({ ...p, agencyName: e.target.value }))}
                placeholder="e.g. Global Research Subscriptions Ltd."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Primary Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData(p => ({ ...p, contactPerson: e.target.value }))}
                placeholder="e.g. John Doe"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Business Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. partner@agency.com"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Phone / Telephone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. +1 234 567 890"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Country of Operation *</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))}
                placeholder="e.g. India, United States"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Website URL</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))}
                placeholder="e.g. https://www.agency.com"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Primary Discipline Focus *</label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #CBD5E1",
                fontSize: "14px",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="Science">Science (Pure & Applied)</option>
              <option value="Technology">Technology & Engineering</option>
              <option value="Medicine">Medicine & Healthcare</option>
              <option value="Multidisciplinary">Multidisciplinary Studies</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Inquiry Details / Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
              placeholder="Detail your requirements, target library base, or specific journals of interest..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #CBD5E1",
                fontSize: "14px",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "#0F172A",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "12px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "10px"
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#F59E0B";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#0F172A";
            }}
          >
            {loading ? "Submitting Enquiries..." : "Register & Submit Enquiry"}
          </button>
        </form>
      </div>
    </main>
  );
}
