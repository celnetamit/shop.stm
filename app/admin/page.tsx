import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type ContactEntryRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
};

export default async function AdminHomePage() {
  const session = await getCurrentSession();
  const recentContacts: ContactEntryRow[] = await prisma.contactEntry.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []);

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <h1>Dashboard</h1>
        <p>Welcome back, {session?.email}</p>
      </header>

      <div className="admin-overview-grid">
        <a className="admin-overview-card" href="/admin/orders"><h3>Manage Orders</h3><p>Track and update order statuses.</p></a>
        <a className="admin-overview-card" href="/admin/proforma"><h3>Proforma Invoices</h3><p>Review and manage user quote entries.</p></a>
        <a className="admin-overview-card" href="/admin/contact-entries"><h3>Contact Entries</h3><p>Handle website contact submissions.</p></a>
        <a className="admin-overview-card" href="/admin/users"><h3>Users</h3><p>Promote or demote users by role.</p></a>
        <a className="admin-overview-card" href="/admin/coupons"><h3>Coupons</h3><p>Create, activate, and disable coupons.</p></a>
      </div>

      <section className="admin-page-section">
        <h2>Recent Contact Enquiries</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {recentContacts.length === 0 ? (
                <tr><td colSpan={6}>No enquiries found.</td></tr>
              ) : (
                recentContacts.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{entry.email}</td>
                    <td>{entry.subject}</td>
                    <td>{entry.message}</td>
                    <td>{entry.status}</td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
