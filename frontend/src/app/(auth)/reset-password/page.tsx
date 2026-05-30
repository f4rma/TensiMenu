import type { Metadata } from "next";
import { Suspense } from "react";

import CenteredAuthLayout from "@/components/auth/CenteredAuthLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Kata Sandi",
  description: "Buat kata sandi baru untuk akun TensiMenu Anda.",
};

export default function ResetPasswordPage() {
  return (
    <CenteredAuthLayout>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </CenteredAuthLayout>
  );
}
