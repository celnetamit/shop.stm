import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import LogoutButton from "@/app/components/logout-button";
import UserActivityTabs from "@/app/components/user-activity-tabs";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  // Fetch data matching the current user's email or ID
  const [proformas, contacts, agencies, orders] = await Promise.all([
    prisma.proformaQuote.findMany({
      where: {
        OR: [
          { createdByUserId: session.sub },
          { email: session.email }
        ]
      },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.contactEntry.findMany({
      where: { email: session.email },
      orderBy: { createdAt: "desc" }
    }),
    prisma.agencyQuery.findMany({
      where: { email: session.email },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { userId: session.sub },
          { email: session.email }
        ]
      },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const totalPaidOrders = orders.filter(o => o.status === "PAID").length;

  const stats = [
    { label: "Paid Invoices", value: totalPaidOrders, icon: "💳", color: "#10B981", bg: "#ECFDF5" },
    { label: "Proforma Quotes", value: proformas.length, icon: "📄", color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Active Enquiries", value: contacts.length + agencies.length, icon: "💬", color: "#8B5CF6", bg: "#F5F3FF" }
  ];

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #F8FAFC, #F1F5F9)", padding: "50px 20px", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Dynamic & Premium Header */}
        <div style={{ 
          background: "rgba(255, 255, 255, 0.8)", 
          backdropFilter: "blur(20px)",
          padding: "30px", 
          borderRadius: "20px", 
          border: "1px solid rgba(226, 232, 240, 0.8)", 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "36px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              color: "white",
              boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)"
            }}>
              {session.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#0F172A" }}>Welcome Back!</h1>
                {session.role === "ADMIN" && (
                  <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "999px" }}>
                    ADMIN POWER
                  </span>
                )}
              </div>
              <p style={{ margin: 0, color: "#64748B", fontSize: "15px" }}>
                Logged in as <strong style={{ color: "#334155" }}>{session.email}</strong>
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {session.role === "ADMIN" && (
              <Link 
                href="/admin" 
                style={{ 
                  color: "#2563EB", 
                  textDecoration: "none", 
                  fontSize: "14px", 
                  fontWeight: "700", 
                  padding: "10px 18px", 
                  borderRadius: "10px", 
                  border: "1px solid #BFDBFE",
                  background: "#EFF6FF",
                  transition: "all 0.2s ease"
                }}
              >
                🛠️ Admin Console
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Dynamic Interactive Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          {stats.map((s, idx) => (
            <div key={idx} style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)"
            }}>
              <div>
                <div style={{ color: "#64748B", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A" }}>{s.value}</div>
              </div>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "12px",
                background: s.bg,
                color: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px"
              }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Tab Panel Container */}
        <div style={{ 
          background: "white", 
          borderRadius: "20px", 
          border: "1px solid #E2E8F0", 
          padding: "30px", 
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.01)" 
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A", margin: "0 0 20px 0" }}>⚡ Account Portfolio & Activity</h2>
          
          <UserActivityTabs 
            proformas={JSON.parse(JSON.stringify(proformas))} 
            contacts={JSON.parse(JSON.stringify(contacts))} 
            agencies={JSON.parse(JSON.stringify(agencies))}
            orders={JSON.parse(JSON.stringify(orders))} 
          />
        </div>

      </div>
    </main>
  );
}
