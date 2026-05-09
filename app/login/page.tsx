import { Suspense } from "react";
import LoginForm from "@/app/components/login-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
