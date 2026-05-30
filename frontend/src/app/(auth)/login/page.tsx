import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { authOptions } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginSidePanel from "@/components/auth/LoginSidePanel";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun TensiMenu Anda untuk melanjutkan perjalanan kesehatan.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout sidePanel={<LoginSidePanel />}>
      <Suspense fallback={<FormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}

function FormFallback() {
  return (
    <div className="mx-auto w-full max-w-md animate-pulse">
      <div className="h-8 w-2/3 rounded-lg bg-brand-charcoal/5" />
      <div className="mt-2 h-4 w-1/2 rounded bg-brand-charcoal/5" />
      <div className="mt-6 h-11 rounded-xl bg-brand-charcoal/5" />
      <div className="mt-4 h-11 rounded-xl bg-brand-charcoal/5" />
      <div className="mt-4 h-11 rounded-2xl bg-brand-charcoal/5" />
    </div>
  );
}
