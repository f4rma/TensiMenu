import type { Metadata } from "next";

import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordSidePanel from "@/components/auth/ForgotPasswordSidePanel";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Atur ulang kata sandi akun TensiMenu Anda.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout sidePanel={<ForgotPasswordSidePanel />}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
