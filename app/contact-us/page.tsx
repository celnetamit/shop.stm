"use client";

import { useState } from "react";

export default function ContactUsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    const res = await fetch("/api/contact-entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, phone, subject, message })
    });

    const json = (await res.json()) as { ok: boolean; error?: string };
    setLoading(false);
    if (!json.ok) {
      setStatus(json.error || "Failed to submit");
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
    setStatus("Thank you. Your enquiry was submitted successfully.");
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <h1>Contact Us</h1>
        <p>Let us know your journal subscription, institutional pricing, or publication support requirements.</p>
      </section>

      <section className="contact-grid">
        <article className="contact-info-card">
          <h2>Get In Touch</h2>
          <p>Our team usually responds within one business day.</p>

          <div className="contact-info-list">
            <div><strong>Email</strong><span>info@stmjournals.com</span></div>
            <div><strong>Phone</strong><span>(+91)-0120-4781-200</span></div>
            <div><strong>Office</strong><span>A-118, Sector-63, Noida, U.P. India</span></div>
          </div>
        </article>

        <article className="contact-form-card">
          <h2>Send Enquiry</h2>
          <form className="contact-form" onSubmit={submit}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" required rows={6} />
            <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Enquiry"}</button>
          </form>
          {status ? <p className="contact-status">{status}</p> : null}
        </article>
      </section>
    </main>
  );
}
