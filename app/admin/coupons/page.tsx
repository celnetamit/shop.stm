"use client";

import { useEffect, useState } from "react";
import React from "react";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
};

type UsageLog = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  currency: string;
  createdAt: string;
  status: string;
};

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Creation Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState<number | "">("");
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Dynamic analytics expansion tracking
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageLog[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; coupons?: Coupon[]; error?: string; warning?: string };
      if (!json.ok) {
        setError(json.error || "Failed to load coupons.");
        return;
      }
      setRows(json.coupons || []);
      setError(json.warning || "");
    } catch (err) {
      setError("Could not connect to administration services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleToggleDetails(couponId: string) {
    if (expandedId === couponId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(couponId);
    setLoadingUsages(true);
    setUsageData([]);
    try {
      const res = await fetch(`/api/coupons/${couponId}`);
      const json = await res.json();
      if (json.ok) {
        setUsageData(json.usages || []);
      }
    } catch (e) {
      console.error("Usage fetch error", e);
    } finally {
      setLoadingUsages(false);
    }
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !value) {
      setError("Please specify both code and value.");
      return;
    }

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          maxUses: maxUses === "" ? null : Number(maxUses),
          minOrderAmount: minOrderAmount === "" ? 0 : Number(minOrderAmount),
          validFrom: validFrom || null,
          validUntil: validUntil || null,
          isActive: true
        })
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error || "Failed to create coupon.");
        return;
      }
      // Clear Inputs
      setCode("");
      setType("PERCENTAGE");
      setValue("");
      setMaxUses("");
      setMinOrderAmount("");
      setValidFrom("");
      setValidUntil("");
      
      await load();
    } catch (err) {
      setError("Failed to submit coupon request.");
    }
  }

  async function toggleStatus(coupon: Coupon) {
    if (coupon.id.startsWith("fallback-")) return;
    try {
      await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive })
      });
      await load();
    } catch (err) {
      setError("Could not update coupon status.");
    }
  }

  async function deleteCoupon(couponId: string) {
    if (couponId.startsWith("fallback-")) return;
    if (!confirm("Are you sure you want to permanently delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupons/${couponId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        if (expandedId === couponId) setExpandedId(null);
        await load();
      } else {
        setError("Failed to delete coupon.");
      }
    } catch (e) {
      setError("Failed to connect.");
    }
  }

  function formatDateLabel(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric"
    });
  }

  return (
    <section className="admin-coupons-container">
      <div className="coupons-header">
        <h1>Coupons Management</h1>
        <p>Create and manage discount codes for users.</p>
      </div>

      {error ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", marginBottom: "16px", color: "#b91c1c", fontSize: "13px" }}>
          {error}
        </div>
      ) : null}

      <div className="coupon-card">
        <h3>
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create New Coupon
        </h3>
        <form onSubmit={createCoupon}>
          <div className="coupon-form-grid">
            <div className="coupon-field-group">
              <label>Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="E.G. SUMMER20"
                className="coupon-input"
                required
              />
            </div>

            <div className="coupon-field-group">
              <label>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="coupon-select"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="coupon-field-group">
              <label>Value *</label>
              <input
                type="number"
                step="any"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={type === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"}
                className="coupon-input"
                required
              />
            </div>

            <div className="coupon-field-group">
              <label>Max Uses</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value === "" ? "" : Math.round(Number(e.target.value)))}
                placeholder="Blank = unlimited"
                className="coupon-input"
              />
            </div>
          </div>

          <div className="coupon-form-grid" style={{ marginTop: "16px" }}>
            <div className="coupon-field-group">
              <label>Min Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1000"
                className="coupon-input"
              />
            </div>

            <div className="coupon-field-group">
              <label>Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="coupon-input"
              />
            </div>

            <div className="coupon-field-group">
              <label>Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="coupon-input"
              />
            </div>

            <button type="submit" className="btn-create-coupon">
              Create Coupon
            </button>
          </div>
        </form>
      </div>

      <div className="coupon-table-card">
        <table className="coupon-table-el">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Validity</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "32px" }}>
                  {loading ? "Synchronizing metrics..." : "No coupons configured yet."}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isExp = expandedId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>
                        <div className="code-td-cell">
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="tag-icon">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.591 0l7.181-7.181a1.125 1.125 0 000-1.591l-9.581-9.581a1.125 1.125 0 00-1.591 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                          </svg>
                          {r.code}
                        </div>
                      </td>
                      <td>
                        <span className="discount-val">
                          {r.type === "PERCENTAGE" ? `${r.value}%` : `₹${r.value.toLocaleString("en-IN")}`}
                        </span>
                        {r.minOrderAmount > 0 ? (
                          <span className="min-order-sub">Min: ₹{r.minOrderAmount.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="min-order-sub">No minimum</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: "#334155" }}>
                          {r.usedCount} / {r.maxUses !== null ? r.maxUses : "-"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", lineHeight: "1.4", color: "#64748b" }}>
                          <div>From: {formatDateLabel(r.validFrom)}</div>
                          <div>Until: {formatDateLabel(r.validUntil)}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-status ${r.isActive ? "active" : "inactive"}`}>
                          {r.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: "flex-end" }}>
                          <div className="chevron-view-details" onClick={() => handleToggleDetails(r.id)}>
                            <svg
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              style={{
                                width: "20px",
                                height: "20px",
                                transform: isExp ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.2s"
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                          <button
                            type="button"
                            className="btn-action-light"
                            onClick={() => void toggleStatus(r)}
                            disabled={r.id.startsWith("fallback-")}
                          >
                            Toggle
                          </button>
                          <button
                            type="button"
                            className="btn-icon-trash"
                            onClick={() => void deleteCoupon(r.id)}
                            disabled={r.id.startsWith("fallback-")}
                            title="Permanently remove coupon"
                          >
                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExp && (
                      <tr className="usage-details-row">
                        <td colSpan={6}>
                          <div className="usage-drawer-content">
                            <h4>Detailed Usage Logs & Insights</h4>
                            {loadingUsages ? (
                              <div style={{ fontSize: "12px", color: "#94a3b8", padding: "8px" }}>Syncing past order metrics...</div>
                            ) : usageData.length === 0 ? (
                              <div style={{ fontSize: "12px", color: "#94a3b8", padding: "8px" }}>No users have applied this coupon to complete a payment yet.</div>
                            ) : (
                              <table className="usage-history-table">
                                <thead>
                                  <tr>
                                    <th>Order Date</th>
                                    <th>Customer Name</th>
                                    <th>Customer Email</th>
                                    <th>Order Net Total</th>
                                    <th>Transaction State</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {usageData.map((usage) => (
                                    <tr key={usage.id}>
                                      <td>{new Date(usage.createdAt).toLocaleString()}</td>
                                      <td style={{ fontWeight: 500 }}>{usage.customerName}</td>
                                      <td style={{ color: "#2563eb" }}>{usage.email}</td>
                                      <td style={{ fontWeight: 600 }}>{usage.currency} {usage.total.toLocaleString()}</td>
                                      <td>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: usage.status === "PAID" ? "#047857" : "#d97706" }}>
                                          {usage.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
