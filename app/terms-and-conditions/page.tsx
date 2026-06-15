import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | STM Journals",
  description: "Review the official Terms and Conditions for subscribing to STM Journals and Books.",
};

export default function TermsPage() {
  return (
    <main className="terms-page" style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ marginBottom: "35px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "38px", color: "#0F172A", marginBottom: "8px" }}>Terms & Conditions</h1>
        <p style={{ fontSize: "14px", color: "#64748B", fontWeight: "500" }}>Effective Date: November 2021</p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: "24px", lineHeight: "1.7", color: "#334155" }}>
        <p style={{ fontSize: "16px", color: "#475569" }}>
          Welcome to shop.stmjournals.com, the official e-commerce platform of STM Journals, owned and operated by Consortium E-Learning Network Pvt. Ltd. By accessing or using our website, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully.
        </p>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>1. Acceptance of Terms</h2>
          <p style={{ margin: 0 }}>
            By accessing, browsing, or using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions, along with our Privacy Policy and any other applicable laws and regulations. If you do not agree to these terms, please do not use this website.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>2. Use of the Website</h2>
          <p style={{ marginBottom: "12px" }}>
            You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else’s use and enjoyment of the website. Prohibited behavior includes but is not limited to:
          </p>
          <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Engaging in any unlawful activity</li>
            <li>Transmitting harmful or malicious content</li>
            <li>Attempting to gain unauthorized access to the website or its systems</li>
          </ul>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>3. Intellectual Property Rights</h2>
          <p style={{ margin: 0 }}>
            All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of STM Journals or its content suppliers and is protected by applicable intellectual property laws. Unauthorized use of any content is strictly prohibited.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>4. Product and Service Descriptions</h2>
          <p style={{ margin: 0 }}>
            We strive to ensure that all product and service descriptions are accurate. However, we do not warrant that descriptions or other content are error-free. If a product or service offered by us is not as described, your sole remedy is to return it in unused condition, subject to our Return Policy.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>5. Pricing and Payment</h2>
          <p style={{ marginBottom: "12px" }}>
            Prices for products and subscriptions are listed in both Indian Rupees (INR) and United States Dollars (USD) to serve our domestic and international customers.
          </p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <li>The applicable currency will be shown based on your location or as selected at checkout.</li>
            <li>All prices are inclusive of applicable taxes unless stated otherwise.</li>
            <li>Prices are subject to change without prior notice.</li>
          </ul>
          <p style={{ marginBottom: "8px", fontWeight: "600", color: "#475569" }}>We accept multiple secure payment methods, including:</p>
          <ul style={{ paddingLeft: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px", margin: 0 }}>
            <li>Credit and Debit Cards</li>
            <li>Net Banking</li>
            <li>UPI (India only)</li>
            <li>Wallets</li>
            <li>International Cards</li>
            <li>Razorpay</li>
          </ul>
          <p style={{ marginTop: "12px", marginBottom: 0, fontStyle: "italic", fontSize: "13px", color: "#64748B" }}>
            By completing the checkout process, you confirm that you are authorized to use the selected payment method and agree to the transaction terms.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>6. Order Acceptance and Cancellation</h2>
          <p style={{ margin: 0 }}>
            We reserve the right to refuse or cancel any order for any reason, including but not limited to product or service availability, errors in the description or price, or errors in your order. If your order is canceled after your payment has been processed, we will issue a full refund.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>7. Shipping and Delivery</h2>
          <p style={{ margin: 0 }}>
            We aim to process and ship orders promptly. Delivery times may vary based on location and other factors. For detailed information, please refer to our <Link href="/shipping-delivery-policy" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "600" }}>Shipping &amp; Delivery Policy</Link>.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>8. Returns and Refunds</h2>
          <p style={{ margin: 0 }}>
            Our Return and Refund Policy outlines the conditions under which returns and refunds are accepted. Please review this policy before making a purchase.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>9. User Accounts</h2>
          <p style={{ margin: 0 }}>
            To access certain features of the website, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>10. Limitation of Liability</h2>
          <p style={{ margin: 0 }}>
            STM Journals shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the website or services, even if we have been advised of the possibility of such damages.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>11. Indemnification</h2>
          <p style={{ margin: 0 }}>
            You agree to indemnify, defend, and hold harmless STM Journals, its officers, directors, employees, agents, and affiliates from any claims, liabilities, damages, losses, or expenses arising out of or in any way connected with your access to or use of the website.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>12. Modifications to Terms & Conditions</h2>
          <p style={{ margin: 0 }}>
            We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting on the website. Your continued use of the website constitutes your acceptance of the revised terms.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#FFFFFF" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "12px", fontWeight: "700" }}>13. Governing Law</h2>
          <p style={{ margin: 0 }}>
            These Terms & Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Delhi, India.
          </p>
        </div>

        <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", background: "#F8FAFC", marginTop: "10px" }}>
          <h2 style={{ fontSize: "20px", color: "#0F172A", marginTop: 0, marginBottom: "16px", fontWeight: "700" }}>Contact Us</h2>
          <p style={{ marginBottom: "16px", marginTop: 0 }}>For any questions or concerns regarding these Terms & Conditions, please contact us at:</p>
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0 }}><strong>📧 Email:</strong> <a href="mailto:subscriptions@stmjournals.com" style={{ color: "#2563EB", textDecoration: "none" }}>subscriptions@stmjournals.com</a></p>
            <p style={{ margin: 0 }}><strong>📞 Phone:</strong> +91 98100 78958</p>
            <p style={{ margin: 0 }}><strong>📍 Address:</strong> A-118, 1st floor, Sector 63, Noida, Uttar Pradesh, 201301, IN</p>
          </div>
        </div>
        
        <p style={{ fontStyle: "italic", fontSize: "14px", color: "#64748B", textAlign: "center", marginTop: "20px" }}>
          By using this website, you signify your acceptance of these Terms & Conditions. If you do not agree to this policy, please do not use our website.
        </p>
      </section>
    </main>
  );
}
