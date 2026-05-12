import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Information for Reviewers",
  description: "Reviewer ethics, responsibilities, and criteria for evaluation at STM Journals."
};

export default function ForReviewersPage() {
  return (
    <main className="policy-page" style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      <nav aria-label="breadcrumb" style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
        Home / For Reviewers
      </nav>
      
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", color: "#0F172A", borderBottom: "2px solid #E2E8F0", paddingBottom: "15px" }}>Information for Reviewers</h1>
      
      <p style={{ lineHeight: 1.7, color: "#475569" }}>
        Reviewers act as the cornerstone of quality in scholarly publishing. We recognize and value the dedication of the reviewers who contribute time to improve published articles.
      </p>

      <article style={{ marginTop: "30px" }}>
        <h2 style={{ fontSize: "24px", color: "#0F172A" }}>Peer Review Standards</h2>
        <p style={{ lineHeight: 1.7, color: "#475569" }}>
          We request all reviewers adhere to ethical standards by avoiding conflicts of interest, maintaining absolute confidentiality regarding the content, and providing objective, constructive feedback aimed at assisting the author's improvement.
        </p>
      </article>

      <article style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "24px", color: "#0F172A" }}>Evaluation Criteria</h2>
        <ul style={{ lineHeight: 1.7, color: "#475569", paddingLeft: "20px" }}>
          <li>Originality & Significance to the field</li>
          <li>Methodological rigor and appropriate data analysis</li>
          <li>Compliance with relevant ethical guidelines</li>
          <li>Clarity of expression and structuring</li>
        </ul>
      </article>
    </main>
  );
}
