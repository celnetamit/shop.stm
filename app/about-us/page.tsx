import Link from "next/link";

export default function AboutUsPage() {
  return (
    <main className="about-us-container" style={{
      maxWidth: "1000px",
      margin: "40px auto",
      padding: "0 20px",
      fontFamily: "Inter, sans-serif",
      color: "#334155"
    }}>
      {/* Editorial Header */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <span style={{
          background: "rgba(245, 158, 11, 0.12)",
          color: "#F59E0B",
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          padding: "4px 12px",
          borderRadius: "9999px",
          display: "inline-block",
          marginBottom: "14px"
        }}>
          Est. 2005
        </span>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "36px",
          fontWeight: "800",
          color: "#0F172A",
          marginBottom: "14px",
          letterSpacing: "-0.02em"
        }}>
          About STM Journals
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#64748b",
          lineHeight: "1.6",
          maxWidth: "700px",
          margin: "0 auto",
          fontWeight: "400"
        }}>
          An imprint of Consortium eLearning Network Pvt. Ltd. Advancing global knowledge through high-quality scientific, technical, and medical publishing.
        </p>
      </div>

      {/* Legacy and Mission Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "40px",
        marginBottom: "60px",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "24px",
            fontWeight: "700",
            color: "#0F172A",
            marginBottom: "16px"
          }}>
            Our Legacy & Mission
          </h2>
          <p style={{
            fontSize: "15px",
            lineHeight: "1.7",
            color: "#475569",
            marginBottom: "16px"
          }}>
            Established in 2005, STM Journals has grown to become a premier name in academic publishing. As a division of Consortium eLearning Network Pvt. Ltd., we are dedicated to the dissemination of high-quality research across Science, Technology, and Medicine.
          </p>
          <p style={{
            fontSize: "15px",
            lineHeight: "1.7",
            color: "#475569"
          }}>
            To be the world&apos;s most trusted source for STM content, leveraging technology to make research accessible, discoverable, and impactful for the betterment of society.
          </p>
        </div>

        <div style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: "4px",
          padding: "30px",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.02)"
        }}>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "18px",
            fontWeight: "700",
            color: "#0F172A",
            marginBottom: "16px"
          }}>
            What We Do
          </h3>
          <p style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#475569",
            marginBottom: "20px"
          }}>
            We publish 274 peer-reviewed journals covering diverse disciplines including Engineering, Biotechnology, Computer Science, Medical Sciences, and Management. Our journals are indexed in major databases and are trusted by leading universities and research institutions globally.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ borderLeft: "3px solid #F59E0B", paddingLeft: "12px" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>274</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Peer-Reviewed Journals</div>
            </div>
            <div style={{ borderLeft: "3px solid #0F172A", paddingLeft: "12px" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>120+</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Countries Served</div>
            </div>
          </div>
        </div>
      </div>

      {/* Managing Director Statement - Styled Blockquote */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        color: "#ffffff",
        borderRadius: "4px",
        padding: "40px",
        marginBottom: "60px",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: "20px",
          left: "30px",
          fontSize: "80px",
          fontFamily: "Georgia, serif",
          color: "rgba(245, 158, 11, 0.08)",
          lineHeight: "1",
          userSelect: "none"
        }}>&ldquo;</div>
        
        <p style={{
          fontSize: "16px",
          lineHeight: "1.8",
          color: "#E2E8F0",
          fontStyle: "italic",
          position: "relative",
          zIndex: "2",
          marginBottom: "20px"
        }}>
          &ldquo;Welcome to STM Journals. Since our inception in 2005, we have been driven by a singular mission: to bridge the gap between academic discovery and practical application. As an imprint of Consortium eLearning Network Pvt. Ltd., we understand that knowledge grows only when it is shared.&rdquo;
        </p>
        <p style={{
          fontSize: "16px",
          lineHeight: "1.8",
          color: "#E2E8F0",
          fontStyle: "italic",
          position: "relative",
          zIndex: "2",
          marginBottom: "24px"
        }}>
          &ldquo;We are committed to providing a robust platform for researchers, scholars, and professionals worldwide. Our rigorous peer-review process and global distribution network ensure that high-quality research reaches the audience it deserves. We invite you to be part of this growing ecosystem of knowledge.&rdquo;
        </p>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
          <strong style={{ display: "block", color: "#F59E0B", fontSize: "16px", fontWeight: "700" }}>Puneet Manhotra</strong>
          <span style={{ display: "block", fontSize: "13px", color: "#94A3B8" }}>Managing Director</span>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Consortium eLearning Network Pvt. Ltd.</span>
        </div>
      </div>

      {/* Quality and Reach features */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "60px"
      }}>
        <div style={{
          border: "1px solid #E2E8F0",
          borderRadius: "4px",
          padding: "24px",
          background: "#ffffff"
        }}>
          <span style={{ fontSize: "24px", marginBottom: "12px", display: "inline-block" }}>🛡️</span>
          <h4 style={{ margin: "0 0 8px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Quality Assurance</h4>
          <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.6", color: "#64748b" }}>Rigorous double-blind peer review process ensuring the highest standards of academic integrity and scientific accuracy.</p>
        </div>
        <div style={{
          border: "1px solid #E2E8F0",
          borderRadius: "4px",
          padding: "24px",
          background: "#ffffff"
        }}>
          <span style={{ fontSize: "24px", marginBottom: "12px", display: "inline-block" }}>🌐</span>
          <h4 style={{ margin: "0 0 8px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>Global Reach</h4>
          <p style={{ margin: "0", fontSize: "13px", lineHeight: "1.6", color: "#64748b" }}>Distribution to over 120 countries with flexible digital access, IP authentication, and print subscription options.</p>
        </div>
      </div>

      {/* Contact Cards Footer */}
      <div style={{
        borderTop: "1px solid #E2E8F0",
        paddingTop: "40px",
        textAlign: "center"
      }}>
        <h3 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "20px",
          fontWeight: "700",
          color: "#0F172A",
          marginBottom: "24px"
        }}>
          Get in Touch With Us
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px"
        }}>
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "4px",
            padding: "20px"
          }}>
            <div style={{ color: "#F59E0B", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Email Us</div>
            <a href="mailto:info@stmjournals.com" style={{ fontSize: "15px", color: "#0F172A", fontWeight: "600", textDecoration: "none" }}>info@stmjournals.com</a>
          </div>
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "4px",
            padding: "20px"
          }}>
            <div style={{ color: "#F59E0B", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Call / WhatsApp</div>
            <a href="tel:+919810078958" style={{ fontSize: "15px", color: "#0F172A", fontWeight: "600", textDecoration: "none" }}>+91-9810078958</a>
          </div>
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "4px",
            padding: "20px"
          }}>
            <div style={{ color: "#F59E0B", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", marginBottom: "6px" }}>Head Office</div>
            <address style={{ fontSize: "13px", color: "#475569", fontStyle: "normal", fontWeight: "500" }}>A-118 1st Floor, Sector 63, Noida, U.P. India</address>
          </div>
        </div>
      </div>
    </main>
  );
}
