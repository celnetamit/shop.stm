import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Information for Authors",
  description: "Comprehensive guidelines for preparing, submitting, and publishing your research manuscript with STM Journals."
};

export default function ForAuthorsPage() {
  return (
    <main className="policy-page" style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      <nav aria-label="breadcrumb" style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
        Home / For Authors
      </nav>
      
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", color: "#0F172A", borderBottom: "2px solid #E2E8F0", paddingBottom: "15px" }}>Information for Authors</h1>
      
      <p style={{ lineHeight: 1.7, color: "#475569" }}>
        At STM Journals, we champion high-quality scholarly research. We support our authors at every step, from manuscript formatting to post-publication exposure.
      </p>

      <article style={{ marginTop: "30px" }}>
        <h2 style={{ fontSize: "24px", color: "#0F172A" }}>1. Submission Guidelines</h2>
        <p style={{ lineHeight: 1.7, color: "#475569" }}>
          Ensure your paper fits within the target journal&apos;s scope. Manuscripts should be written in clear, concise English. You can use our standard templates available upon request.
        </p>
      </article>

      <article style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "24px", color: "#0F172A" }}>2. Formatting Requirements</h2>
        <ul style={{ lineHeight: 1.7, color: "#475569", paddingLeft: "20px" }}>
          <li>Abstract length: Up to 250 words.</li>
          <li>Include 4-6 keywords for maximum search visibility.</li>
          <li>References must follow the specific citation style designated by your target domain.</li>
        </ul>
      </article>

      <article style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "24px", color: "#0F172A" }}>3. Peer Review Process</h2>
        <p style={{ lineHeight: 1.7, color: "#475569" }}>
          All submissions undergo rigorous, double-blind peer review to ensure original and impactful contributions to science, technology, and medicine.
        </p>
      </article>
    </main>
  );
}
