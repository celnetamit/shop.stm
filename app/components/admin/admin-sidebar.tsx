"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/journals", label: "Journals & Pricing" },
  { href: "/admin/department-catalogue", label: "Department Catalogues" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/proforma", label: "Proforma Quotes" },
  { href: "/admin/pi-users", label: "PI Users" },
  { href: "/admin/contact-entries", label: "Contact Entries" },
  { href: "/admin/agency-queries", label: "Agency Queries" },
  { href: "/admin/chats", label: "Chat Leads" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/email-templates", label: "Email Templates" },
  { href: "/admin/coupons", label: "Coupons" }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>Admin Panel</h2>
        <p>STM Journals</p>
      </div>
      <nav className="admin-sidebar-nav">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <a key={link.href} href={link.href} className={active ? "active" : ""}>
              {link.label}
            </a>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <a href="/api/auth/logout">Logout</a>
      </div>
    </aside>
  );
}
