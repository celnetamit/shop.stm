import RegisterForm from "@/app/components/register-form";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) redirect("/account");

  return (
    <main className="auth-shell">
      <RegisterForm />
    </main>
  );
}
