import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import AdminSidebar from "@/app/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <main className="admin-layout">
      <AdminSidebar />
      <section className="admin-content">{children}</section>
    </main>
  );
}
