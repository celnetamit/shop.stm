import { Suspense } from "react";
import LoginForm from "@/app/components/login-form";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/account");

  return (
    <main className="auth-shell">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
