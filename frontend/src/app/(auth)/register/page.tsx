import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterSidePanel from "@/components/auth/RegisterSidePanel";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Daftar",
  description:
    "Buat akun TensiMenu untuk mulai mengelola tekanan darah dengan rekomendasi DASH Diet personal.",
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout sidePanel={<RegisterSidePanel />}>
      <RegisterForm />
    </AuthLayout>
  );
}
