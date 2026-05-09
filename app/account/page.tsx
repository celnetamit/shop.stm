import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import LogoutButton from "@/app/components/logout-button";

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1>My Account</h1>
        <p><strong>Email:</strong> {session.email}</p>
        <p><strong>Role:</strong> {session.role}</p>
        <p>This is the user dashboard area.</p>
        <LogoutButton />
      </div>
    </main>
  );
}
