"use client";

import { useEffect, useState } from "react";

// Independence Day 2026 promo strip. Advertises the FREEDOM15 coupon
// (15% off, seeded via scripts/seed-freedom15-coupon.js) on every page and
// retires itself automatically once the offer window closes.

const PROMO_CODE = "FREEDOM15";
const DISMISS_KEY = "stm-promo-freedom15-dismissed";

// End of day 15 August 2026, IST (UTC+5:30) — matches the coupon's validUntil.
const PROMO_ENDS_AT = new Date(Date.parse("2026-08-15T23:59:59Z") - 5.5 * 60 * 60 * 1000);

const SAFFRON = "#FF9933";
const GREEN = "#138808";
const NAVY = "#0b2265";

export default function IndependenceDayBanner() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (Date.now() > PROMO_ENDS_AT.getTime()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // Private mode / storage blocked — show the banner anyway.
    }
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Nothing to persist to; the banner simply returns on the next page load.
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="freedom-banner" role="region" aria-label="Independence Day 2026 offer">
      <style>{`
        .freedom-banner {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(120% 180% at 12% 0%, rgba(255,153,51,0.28) 0%, rgba(255,153,51,0) 55%),
            radial-gradient(120% 180% at 88% 100%, rgba(19,136,8,0.30) 0%, rgba(19,136,8,0) 55%),
            linear-gradient(100deg, #071a45 0%, #0b2265 46%, #071a45 100%);
          color: #ffffff;
          font-family: Outfit, "Segoe UI", sans-serif;
          border-bottom: 1px solid rgba(255,255,255,0.14);
        }
        .freedom-banner::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, ${SAFFRON} 0%, ${SAFFRON} 33.3%, #ffffff 33.3%, #ffffff 66.6%, ${GREEN} 66.6%, ${GREEN} 100%);
        }
        .freedom-banner-inner {
          max-width: 1300px;
          margin: 0 auto;
          padding: 12px 52px 12px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
          text-align: center;
        }
        .freedom-flag {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .freedom-chakra {
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          animation: freedom-spin 9s linear infinite;
        }
        @keyframes freedom-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .freedom-chakra { animation: none; }
        }
        .freedom-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${SAFFRON};
          line-height: 1.2;
        }
        .freedom-title {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
          margin: 0;
          color: #ffffff;
        }
        .freedom-title em {
          font-style: normal;
          color: #ffd9a8;
        }
        .freedom-code {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px dashed rgba(255,255,255,0.55);
          border-radius: 999px;
          padding: 6px 8px 6px 14px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .freedom-copy {
          border: none;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          background: linear-gradient(135deg, ${SAFFRON}, #ff7a1a);
          color: ${NAVY};
          font-family: inherit;
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .freedom-copy:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .freedom-copy.is-copied {
          background: linear-gradient(135deg, #34d07f, ${GREEN});
          color: #ffffff;
        }
        .freedom-valid {
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.78);
          white-space: nowrap;
        }
        .freedom-close {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          color: #ffffff;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .freedom-close:hover { background: rgba(255,255,255,0.24); }
        @media (max-width: 720px) {
          .freedom-banner-inner { gap: 8px; padding: 12px 42px 12px 14px; }
          .freedom-flag { width: 100%; justify-content: center; }
          .freedom-title { font-size: 13px; }
          .freedom-eyebrow { font-size: 9px; letter-spacing: 0.14em; }
          .freedom-code { font-size: 12px; padding: 5px 6px 5px 12px; }
          .freedom-valid { white-space: normal; font-size: 11px; }
        }
      `}</style>

      <div className="freedom-banner-inner">
        <span className="freedom-flag">
          <svg className="freedom-chakra" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="none" stroke={SAFFRON} strokeWidth="5" />
            <circle cx="50" cy="50" r="7" fill={NAVY} stroke="#ffffff" strokeWidth="3" />
            {Array.from({ length: 24 }, (_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={50 + 9 * Math.cos(angle)}
                  y1={50 + 9 * Math.sin(angle)}
                  x2={50 + 44 * Math.cos(angle)}
                  y2={50 + 44 * Math.sin(angle)}
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              );
            })}
          </svg>
          <span style={{ textAlign: "left" }}>
            <span className="freedom-eyebrow">Independence Day 2026</span>
            <p className="freedom-title">
              Celebrate freedom with <em>15% OFF</em> on your entire order
            </p>
          </span>
        </span>

        <span className="freedom-code">
          Use code <strong style={{ color: "#ffd9a8", letterSpacing: "0.12em" }}>{PROMO_CODE}</strong>
          <button
            type="button"
            className={`freedom-copy${copied ? " is-copied" : ""}`}
            onClick={copyCode}
            aria-label={`Copy coupon code ${PROMO_CODE}`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </span>

        <span className="freedom-valid">🇮🇳 Valid till 15 August 2026</span>
      </div>

      <button type="button" className="freedom-close" onClick={dismiss} aria-label="Dismiss offer banner">
        ×
      </button>
    </div>
  );
}
