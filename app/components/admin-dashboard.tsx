"use client";

import { useEffect, useState } from "react";

type Order = { id: string; customerName: string; email: string; total: number; currency: "INR" | "USD"; status: "PENDING" | "PAID" | "CANCELLED"; createdAt: string };
type Proforma = { id: string; organization: string; contactName: string; email: string; status: "DRAFT" | "SUBMITTED"; createdAt: string; items: Array<{ id: string }> };
type ContactEntry = { id: string; name: string; email: string; subject: string; message: string; status: "NEW" | "IN_PROGRESS" | "RESOLVED"; createdAt: string };
type User = { id: string; name: string | null; email: string; role: "USER" | "ADMIN" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR"; createdAt: string };
type Coupon = { id: string; code: string; discount: number; isActive: boolean; createdAt: string };

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [contactEntries, setContactEntries] = useState<ContactEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      orders?: Order[];
      proformas?: Proforma[];
      contactEntries?: ContactEntry[];
      users?: User[];
      coupons?: Coupon[];
    };
    if (!json.ok) {
      setError(json.error || "Failed to load dashboard");
      return;
    }

    setOrders(json.orders || []);
    setProformas(json.proformas || []);
    setContactEntries(json.contactEntries || []);
    setUsers(json.users || []);
    setCoupons(json.coupons || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, discount, isActive: true })
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setError(json.error || "Failed to create coupon");
      return;
    }
    setCode("");
    setDiscount(10);
    await load();
  }

  async function updateCoupon(id: string, patch: { isActive?: boolean }) {
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
    await load();
  }

  async function deleteCoupon(id: string) {
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    await load();
  }

  async function updateOrderStatus(id: string, status: Order["status"]) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
  }

  async function updateProformaStatus(id: string, status: Proforma["status"]) {
    await fetch(`/api/admin/proforma/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
  }

  async function updateContactStatus(id: string, status: ContactEntry["status"]) {
    await fetch(`/api/admin/contact-entries/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
  }

  async function updateUserRole(id: string, role: User["role"]) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    });
    await load();
  }

  return (
    <section className="admin-dashboard">
      <h2>Admin Management</h2>
      {error ? <p className="auth-error">{error}</p> : null}

      <div className="admin-block">
        <h3>Orders</h3>
        {orders.map((order) => (
          <div key={order.id} className="admin-row">
            <div>
              <strong>{order.customerName}</strong>
              <p>{order.email}</p>
              <p>{order.currency} {order.total.toLocaleString()}</p>
            </div>
            <select value={order.status} onChange={(e) => void updateOrderStatus(order.id, e.target.value as Order["status"])}>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        ))}
      </div>

      <div className="admin-block">
        <h3>Proforma / Quote Entries</h3>
        {proformas.map((q) => (
          <div key={q.id} className="admin-row">
            <div>
              <strong>{q.organization}</strong>
              <p>{q.contactName} ({q.email})</p>
              <p>Items: {q.items.length}</p>
            </div>
            <select value={q.status} onChange={(e) => void updateProformaStatus(q.id, e.target.value as Proforma["status"])}>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
            </select>
          </div>
        ))}
      </div>

      <div className="admin-block">
        <h3>Contact Us Entries</h3>
        {contactEntries.map((entry) => (
          <div key={entry.id} className="admin-row">
            <div>
              <strong>{entry.subject}</strong>
              <p>{entry.name} ({entry.email})</p>
              <p>{entry.message}</p>
            </div>
            <select value={entry.status} onChange={(e) => void updateContactStatus(entry.id, e.target.value as ContactEntry["status"])}>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        ))}
      </div>

      <div className="admin-block">
        <h3>Users</h3>
        {users.map((user) => (
          <div key={user.id} className="admin-row">
            <div>
              <strong>{user.name || "Unnamed User"}</strong>
              <p>{user.email}</p>
            </div>
            <select value={user.role} onChange={(e) => void updateUserRole(user.id, e.target.value as User["role"])}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="LIBRARIAN">LIBRARIAN</option>
              <option value="AGENCY">AGENCY</option>
              <option value="STUDENT">STUDENT</option>
              <option value="SCHOLAR">SCHOLAR</option>
            </select>
          </div>
        ))}
      </div>

      <div className="admin-block">
        <h3>Coupons</h3>
        <form onSubmit={createCoupon} className="admin-coupon-form">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" required />
          <input type="number" min={1} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} required />
          <button type="submit">Create Coupon</button>
        </form>
        <div className="admin-coupon-list">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="admin-coupon-row">
              <strong>{coupon.code}</strong>
              <span>{coupon.discount}%</span>
              <span>{coupon.isActive ? "Active" : "Inactive"}</span>
              <button type="button" onClick={() => void updateCoupon(coupon.id, { isActive: !coupon.isActive })}>{coupon.isActive ? "Disable" : "Enable"}</button>
              <button type="button" onClick={() => void deleteCoupon(coupon.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
