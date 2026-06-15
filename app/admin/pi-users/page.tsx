"use client";

import { Fragment, useEffect, useState } from "react";
import { resolvePiNumber } from "@/lib/pi-number";

type PiItem = { id: string; journalName: string; selectedPlan: "PRINT" | "ONLINE" | "PRINT_ONLINE"; unitPrice: number };
type PiEntry = {
  id: string;
  piNumber?: string | null;
  createdAt: string;
  status: "DRAFT" | "SUBMITTED" | "PAID";
  subscriberCategory?: string | null;
  couponCode?: string | null;
  couponPercent?: number | null;
  items: PiItem[];
};
type PiUser = { email: string; name: string; collegeName: string; latestAt: string; entries: PiEntry[] };

export default function AdminPiUsersPage() {
  const [rows, setRows] = useState<PiUser[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [activeItems, setActiveItems] = useState<{ quoteId: string; piNumber?: string | null; createdAt: string; items: PiItem[]; couponCode?: string | null; couponPercent?: number | null } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/pi-users", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; users?: PiUser[] };
      setRows(json.ok ? (json.users || []) : []);
    })();
  }, []);

  return (
    <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "14px" }}>PI Users (Unique Email)</h1>
      <div style={{ overflowX: "auto", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", fontSize: "13px" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "10px", textAlign: "left" }}>College Name</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Last PI</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.email}>
                <tr key={r.email} style={{ borderTop: "1px solid #e2e8f0", fontSize: "13px" }}>
                  <td style={{ padding: "10px" }}>{r.name}</td>
                  <td style={{ padding: "10px" }}>{r.email}</td>
                  <td style={{ padding: "10px" }}>{r.collegeName}</td>
                  <td style={{ padding: "10px" }}>{new Date(r.latestAt).toLocaleString()}</td>
                  <td style={{ padding: "10px" }}>
                    <button onClick={() => setOpen((p) => ({ ...p, [r.email]: !p[r.email] }))} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: "6px", padding: "4px 8px" }}>
                      {open[r.email] ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
                {open[r.email] ? (
                  <tr key={`${r.email}-details`} style={{ background: "#f8fafc" }}>
                    <td colSpan={5} style={{ padding: "10px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", border: "1px solid #e2e8f0" }}>
                        <thead>
                          <tr style={{ fontSize: "12px", background: "#f1f5f9" }}>
                            <th style={{ padding: "8px", textAlign: "left" }}>PI ID</th>
                            <th style={{ padding: "8px", textAlign: "left" }}>Created At</th>
                            <th style={{ padding: "8px", textAlign: "left" }}>Category</th>
                            <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                            <th style={{ padding: "8px", textAlign: "left" }}>Journals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.entries.map((e) => (
                            <tr key={e.id} style={{ borderTop: "1px solid #e2e8f0", fontSize: "12px" }}>
                              <td style={{ padding: "8px" }}>{resolvePiNumber(e)}</td>
                              <td style={{ padding: "8px" }}>{new Date(e.createdAt).toLocaleString()}</td>
                              <td style={{ padding: "8px" }}>{e.subscriberCategory || "-"}</td>
                              <td style={{ padding: "8px" }}>{e.status}</td>
                              <td style={{ padding: "8px" }}>
                                <button onClick={() => setActiveItems({ quoteId: e.id, piNumber: e.piNumber, createdAt: e.createdAt, items: e.items, couponCode: e.couponCode, couponPercent: e.couponPercent })} style={{ border: "1px solid #cbd5e1", background: "white", borderRadius: "6px", padding: "3px 8px" }}>
                                  ＋
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {activeItems ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ width: "min(800px, 94vw)", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>Selected Journals & Variants ({resolvePiNumber({ id: activeItems.quoteId, createdAt: activeItems.createdAt, piNumber: activeItems.piNumber })})</h3>
              <button onClick={() => setActiveItems(null)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Journal</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Variant</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.items.map((it) => (
                  <tr key={it.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px" }}>{it.journalName}</td>
                    <td style={{ padding: "8px" }}>{it.selectedPlan === "PRINT_ONLINE" ? "PRINT + DIGITAL" : it.selectedPlan}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>₹{it.unitPrice.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {(() => {
                  const subtotal = activeItems.items.reduce((sum, it) => sum + (it.unitPrice || 0), 0);
                  const couponPct = activeItems.couponPercent || 0;
                  const discount = Math.round((subtotal * couponPct) / 100);
                  const net = subtotal - discount;
                  return (
                    <>
                      <tr style={{ borderTop: "1px solid #cbd5e1", background: "#fcfdff" }}>
                        <td colSpan={2} style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>Subtotal</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>₹{subtotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ padding: "8px", textAlign: "right", color: "#16a34a" }}>
                          Coupon Used: {activeItems.couponCode ? `${activeItems.couponCode} (${couponPct}%)` : "Not Used"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#16a34a" }}>-₹{discount.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr style={{ borderTop: "1px solid #cbd5e1", background: "#f8fafc" }}>
                        <td colSpan={2} style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>Net Amount</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>₹{net.toLocaleString("en-IN")}</td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
