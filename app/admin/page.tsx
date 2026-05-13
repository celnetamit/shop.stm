import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AdminDashboardTabs from "@/app/components/admin-dashboard-tabs";

export const dynamic = "force-dynamic";

type ContactEntryRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
};

type AgencyQueryRow = {
  id: string;
  agencyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  website: string | null;
  specialization: string;
  message: string | null;
  createdAt: Date;
};

export default async function AdminHomePage() {
  const session = await getCurrentSession();

  // Fetch dynamic dashboard snapshot metrics + recent records
  const [
    recentContacts, 
    recentAgencies, 
    recentProformas, 
    recentOrders,
    totalOrders,
    totalQuotes,
    totalAgencies,
    totalUsers
  ] = await Promise.all([
    prisma.contactEntry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => [] as ContactEntryRow[]),
    prisma.agencyQuery.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => [] as AgencyQueryRow[]),
    prisma.proformaQuote.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),
    prisma.order.count().catch(() => 0),
    prisma.proformaQuote.count().catch(() => 0),
    prisma.agencyQuery.count().catch(() => 0),
    prisma.user.count().catch(() => 0)
  ]);

  const statCards = [
    { label: "Total Orders", value: totalOrders, icon: "🛒", color: "#2563EB", bg: "#EFF6FF" },
    { label: "B2B Invoices", value: totalQuotes, icon: "📄", color: "#D97706", bg: "#FFFBEB" },
    { label: "Agencies Joined", value: totalAgencies, icon: "🤝", color: "#059669", bg: "#ECFDF5" },
    { label: "System Users", value: totalUsers, icon: "👤", color: "#7C3AED", bg: "#F5F3FF" }
  ];

  const actionCards = [
    { title: "Manage Orders", desc: "Track order history & logs", url: "/admin/orders", color: "#3B82F6" },
    { title: "Proforma Invoices", desc: "Manage B2B generated quotes", url: "/admin/proforma", color: "#F59E0B" },
    { title: "Contact Entries", desc: "Review user query inbox", url: "/admin/contact-entries", color: "#EC4899" },
    { title: "Agency Queries", desc: "Verify partner integrations", url: "/admin/agency-queries", color: "#10B981" },
    { title: "System Users", desc: "Administer role permissions", url: "/admin/users", color: "#8B5CF6" },
    { title: "Email Templates", desc: "Sync system communication", url: "/admin/email-templates", color: "#6366F1" }
  ];

  return (
    <section style={{ padding: "40px", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Outfit, sans-serif" }}>
      
      {/* Dynamic Aesthetic Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: "#0F172A" }}>System Dashboard</h1>
            <span style={{ background: "#ECFDF5", color: "#047857", fontSize: "12px", fontWeight: "bold", padding: "4px 10px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", background: "#10B981", borderRadius: "50%" }}></span> Live Engine
            </span>
          </div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "15px" }}>Welcome, <strong>{session?.email}</strong>. Monitor platform metrics and logistics.</p>
        </div>
      </header>

      {/* High-Fidelity Top Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)"
          }}>
            <div>
              <div style={{ color: "#64748B", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A" }}>{s.value.toLocaleString()}</div>
            </div>
            <div style={{
              width: "54px",
              height: "54px",
              background: s.bg,
              color: s.color,
              borderRadius: "12px",
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

      {/* Unified Management Grid (Polished Navigation) */}
      <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#334155", marginBottom: "20px" }}>⚡ Quick Operations</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {actionCards.map((act, i) => (
          <a 
            key={i} 
            href={act.url} 
            className="adm-act-card"
          >
            {/* Left glowing color bar */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", background: act.color }}></div>
            
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>{act.title}</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748B", lineHeight: 1.4 }}>{act.desc}</p>
          </a>
        ))}
      </div>

      {/* De-congested Multi-Tab Activity Viewport */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#334155", margin: 0 }}>📊 Unified Activity Monitor</h2>
        <span style={{ fontSize: "12px", color: "#94A3B8" }}>Displaying last 5 active entries</span>
      </div>

      <AdminDashboardTabs 
        contacts={JSON.parse(JSON.stringify(recentContacts))}
        agencies={JSON.parse(JSON.stringify(recentAgencies))}
        proformas={JSON.parse(JSON.stringify(recentProformas))}
        orders={JSON.parse(JSON.stringify(recentOrders))}
      />

    </section>
  );
}
