import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | STM Journals",
  description: "Learn about our order processing times, shipping charges, international locations, and delivery timelines.",
};

export default function ShippingPolicyPage() {
  return (
    <main className="shipping-page" style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ marginBottom: "35px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", color: "#0F172A", marginBottom: "8px" }}>Shipping & Delivery Policy</h1>
        <p style={{ fontSize: "14px", color: "#64748B", fontWeight: "500" }}>Effective Date: November 2021</p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: "24px", lineHeight: "1.7", color: "#334155" }}>
        <p style={{ fontSize: "16px", color: "#475569" }}>
          At STM Journals Shop, we strive to ensure that your orders are processed, packed, and delivered to you in a timely and efficient manner. This Shipping & Delivery Policy outlines the terms and conditions related to the shipping of products purchased through our platform.
        </p>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>What Do We Ship? 🛍️</h2>
          <p style={{ marginBottom: "12px" }}>We offer shipping for the following physical products:</p>
          <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Print journal subscriptions (monthly, quarterly, annual)</li>
            <li>Special issues and themed volumes</li>
            <li>Conference proceedings (print version)</li>
            <li>Academic books and research reports</li>
          </ul>
          <p style={{ marginTop: "12px", marginBottom: 0, fontStyle: "italic", fontSize: "14px", color: "#64748B" }}>
            Note: Digital products such as online journal access or e-books are delivered electronically via email or secure portal login.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Shipping Locations 🚚</h2>
          <p style={{ marginBottom: "12px" }}>We currently ship physical products to:</p>
          <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>All regions within India</li>
            <li>Selected international locations including Asia-Pacific, Europe, North America, Middle East, and Africa</li>
          </ul>
          <p style={{ marginTop: "12px", margin: 0 }}>
            If you are unsure whether we ship to your specific country, please contact us at <a href="mailto:subscriptions@stmjournals.com" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "600" }}>subscriptions@stmjournals.com</a> before placing your order.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Order Processing Time ⏱️</h2>
          <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>All confirmed orders are processed within <strong>2–5 business days</strong>.</li>
            <li>Orders placed on weekends or public holidays will be processed on the next working day.</li>
            <li>For journal subscriptions, the first physical issue is typically dispatched within <strong>7–10 business days</strong> from the date of confirmation.</li>
          </ul>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Estimated Delivery Time 📮</h2>
          <p style={{ margin: 0 }}>
            Standard delivery timelines vary based on location, local postal service efficiency, and customs clearance procedures for international deliveries. Typically, domestic orders are delivered within 3–7 business days after dispatch, and international orders within 10–20 business days.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Shipping Charges 📦</h2>
          <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            <li><strong>Domestic Orders (India)</strong>: Shipping is usually included in the product price unless explicitly stated otherwise.</li>
            <li><strong>International Orders</strong>: Shipping charges are calculated dynamically based on package weight, destination, and courier service rates. These charges are transparently displayed at checkout before you complete your payment.</li>
          </ul>
          <p style={{ margin: 0, fontWeight: "600", color: "#DC2626", fontSize: "14px" }}>
            ⚠️ Customs duties, import taxes, or local handling fees (if applicable in the destination country) are the sole responsibility of the buyer.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Split Shipments 🔁</h2>
          <p style={{ margin: 0 }}>
            If your order contains multiple items (e.g., back issues, new journal subscriptions, and academic books), we may ship them separately depending on availability, ensuring you get each component as fast as possible without any additional shipping cost to you.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Order Tracking 🔐</h2>
          <p style={{ margin: 0 }}>
            Once your order has been dispatched, you will receive a shipping confirmation email containing tracking details, where available. Please allow 24–48 hours for tracking updates to appear on the carrier&apos;s website after the dispatch notification.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Issues with Delivery 📩</h2>
          <p style={{ marginBottom: "12px" }}>If your order has not arrived within the estimated delivery timeline:</p>
          <ol style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
            <li>Check the real-time tracking link shared in your confirmation email.</li>
            <li>Contact our dedicated support team via our <Link href="/contact-us" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "600" }}>Contact Page</Link> or email us directly.</li>
          </ol>
          <p style={{ margin: 0 }}>
            We will assist you immediately in locating or re-shipping your order in accordance with our replacement terms.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Packaging 📦</h2>
          <p style={{ margin: 0 }}>
            All physical journals and books are securely packed using tamper-proof, highly-durable, and where possible, eco-friendly or recyclable packaging material to ensure your valuable academic resources reach you in pristine, undamaged condition.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>Delays Due to Force Majeure ❗</h2>
          <p style={{ marginBottom: "12px" }}>Delivery may occasionally be delayed due to unforeseen events out of our control, such as:</p>
          <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Natural disasters, extreme weather, or acts of God</li>
            <li>National or public holidays</li>
            <li>Regional transportation/logistics strikes</li>
            <li>Unforeseen regulatory or customs hold-ups (for international orders)</li>
          </ul>
          <p style={{ marginTop: "12px", margin: 0, fontStyle: "italic" }}>
            We deeply appreciate your patience and understanding during such exceptional circumstances.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#F8FAFC", marginTop: "10px" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "16px", fontWeight: "700" }}>📞 Contact Us for Shipping Assistance</h2>
          <p style={{ marginBottom: "16px", marginTop: 0 }}>For any shipping-related queries or immediate assistance, please reach out to:</p>
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0 }}><strong>📧 Email:</strong> <a href="mailto:subscriptions@stmjournals.com" style={{ color: "#2563EB", textDecoration: "none" }}>subscriptions@stmjournals.com</a></p>
            <p style={{ margin: 0 }}><strong>📞 Phone:</strong> +91 98100 78958</p>
            <p style={{ margin: 0 }}><strong>🌐 Web:</strong> <Link href="/contact-us" style={{ color: "#2563EB", textDecoration: "none" }}>STM Contact Portal</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
