import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import LogoutButton from "@/app/components/logout-button";
import UserActivityTabs from "@/app/components/user-activity-tabs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  // Fetch data matching the current user's email or ID
  const [proformas, contacts, agencies] = await Promise.all([
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
    })
  ]);

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Profile Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px", background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", color: "#0F172A", fontSize: "32px", fontFamily: "Outfit, sans-serif" }}>User Dashboard</h1>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: "16px" }}><strong>Email:</strong> {session.email}</p>
            <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>Role: <span style={{ background: "#E2E8F0", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", color: "#334155" }}>{session.role}</span></p>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>

        {/* Activity Dashboard */}
        <h2 style={{ fontSize: "20px", color: "#0F172A", marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>Your Activity</h2>
        <UserActivityTabs proformas={proformas} contacts={contacts} agencies={agencies} />

      </div>
    </main>
  );
}
