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
  const [recentContacts, recentAgencies, recentProformas, recentOrders] = await Promise.all([
    prisma.contactEntry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => [] as ContactEntryRow[]),
    prisma.agencyQuery.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => [] as AgencyQueryRow[]),
    prisma.proformaQuote.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => [])
  ]);

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

      <section className="admin-page-section" style={{ marginBottom: "40px" }}>
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

      <section className="admin-page-section">
        <h2>Recent Agency Queries</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Website</th>
                <th>Specialization</th>
                <th>Message</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentAgencies.length === 0 ? (
                <tr><td colSpan={9}>No agency queries found.</td></tr>
              ) : (
                recentAgencies.map((query) => (
                  <tr key={query.id}>
                    <td><strong>{query.agencyName}</strong></td>
                    <td>{query.contactPerson}</td>
                    <td><a href={`mailto:${query.email}`}>{query.email}</a></td>
                    <td>{query.phone}</td>
                    <td>{query.country}</td>
                    <td>{query.website ? <a href={query.website} target="_blank" rel="noopener noreferrer">{query.website}</a> : "-"}</td>
                    <td><span className="badge-specialization" style={{ background: "#F1F5F9", color: "#334155", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: "600" }}>{query.specialization}</span></td>
                    <td>{query.message || "-"}</td>
                    <td>{new Date(query.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-page-section" style={{ marginBottom: "40px" }}>
        <h2>Recent Proforma Quotes</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentProformas.length === 0 ? (
                <tr><td colSpan={7}>No proforma quotes found.</td></tr>
              ) : (
                recentProformas.map((quote: any) => (
                  <tr key={quote.id}>
                    <td><strong>{quote.organization}</strong></td>
                    <td>{quote.contactName}</td>
                    <td><a href={`mailto:${quote.email}`}>{quote.email}</a></td>
                    <td>{quote.phone}</td>
                    <td>{quote.country}</td>
                    <td>{quote.status}</td>
                    <td>{new Date(quote.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-page-section">
        <h2>Recent Orders</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5}>No orders found.</td></tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td><strong>{order.customerName}</strong></td>
                    <td><a href={`mailto:${order.email}`}>{order.email}</a></td>
                    <td>{order.currency} {order.total}</td>
                    <td>{order.status}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
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
