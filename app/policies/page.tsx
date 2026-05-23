import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial & Publication Policies",
  description: "Policies concerning ethics, open access, subscriptions, and copyright at STM Journals."
};

export default function PoliciesPage() {
  return (
    <main className="policy-page" style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", color: "#0F172A", marginBottom: "30px" }}>Editorial & Publication Policies</h1>
      
      <section style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "24px" }}>
          <h2 style={{ fontSize: "22px", color: "#0F172A", marginTop: 0 }}>Ethics Policy</h2>
          <p style={{ lineHeight: 1.6, color: "#475569" }}>
            STM Journals takes publication ethics extremely seriously. Plagiarism, falsification, and duplication are prohibited.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "24px" }}>
          <h2 style={{ fontSize: "22px", color: "#0F172A", marginTop: 0 }}>Open Access Option</h2>
          <p style={{ lineHeight: 1.6, color: "#475569" }}>
            We offer authors the ability to publish under open access models, complying with global funder requirements to make science available everywhere.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "24px" }}>
          <h2 style={{ fontSize: "22px", color: "#0F172A", marginTop: 0 }}>Subscription Terms</h2>
          <p style={{ lineHeight: 1.6, color: "#475569" }}>
            Subscriptions can cover standard print editions, digital online access, or bundled delivery. Subscriptions are renewed annually.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "24px" }}>
          <h2 style={{ fontSize: "22px", color: "#0F172A", marginTop: 0 }}>Data & Security Compliance</h2>
          <p style={{ lineHeight: 1.6, color: "#475569", marginTop: 0 }}>
            STM Journals follows governance and data handling controls aligned with DPDP (India), GDPR for applicable international users, and SOC 2 security principles.
          </p>
          <ul style={{ paddingLeft: "20px", margin: 0, color: "#475569", lineHeight: 1.6 }}>
            <li>Consent-led cookie and tracking preferences</li>
            <li>Purpose limitation and access controls for user data</li>
            <li>Monitoring, incident response, and security hardening workflows</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
