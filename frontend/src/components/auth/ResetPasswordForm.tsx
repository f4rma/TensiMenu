"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck, RotateCcw } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>(() =>
    !token ? { form: "Tautan reset tidak valid atau sudah kedaluwarsa." } : {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: FormErrors = {};
    if (!password) next.password = "Kata sandi wajib diisi";
    else if (password.length < 8) next.password = "Kata sandi minimal 8 karakter";

    if (!confirmPassword) next.confirmPassword = "Konfirmasi kata sandi wajib diisi";
    else if (password !== confirmPassword)
      next.confirmPassword = "Kata sandi tidak cocok";

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    if (!token) {
      setErrors({ form: "Tautan reset tidak valid atau sudah kedaluwarsa." });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/reset-password/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: password }),
        }
      );

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          setErrors({ form: "Tautan reset tidak valid atau sudah kedaluwarsa." });
        } else {
          setErrors({
            form: "Terjadi kesalahan. Silakan coba beberapa saat lagi.",
          });
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setErrors({
        form: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Kata Sandi Berhasil Diubah
        </h1>
        <p className="mt-1.5 text-sm text-brand-charcoal-soft">
          Anda akan diarahkan ke halaman login...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Icon badge */}
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <RotateCcw className="h-5 w-5" strokeWidth={2.25} />
        </span>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Buat Kata Sandi Baru
        </h1>
        <p className="mt-1.5 text-sm text-brand-charcoal-soft">
          Silakan masukkan kata sandi baru untuk akun kamu.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        {errors.form && <Alert variant="error">{errors.form}</Alert>}

        <FormField
          label="Kata sandi baru"
          htmlFor="new-password"
          required
          error={errors.password}
        >
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 karakter"
            leftIcon={<Lock className="h-4 w-4" />}
            showPasswordToggle
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            hasError={!!errors.password}
            disabled={submitting}
          />
        </FormField>

        <FormField
          label="Konfirmasi kata sandi baru"
          htmlFor="confirm-password"
          required
          error={errors.confirmPassword}
        >
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            showPasswordToggle
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((p) => ({ ...p, confirmPassword: undefined }));
            }}
            hasError={!!errors.confirmPassword}
            disabled={submitting}
          />
        </FormField>

        <Button type="submit" fullWidth size="md" loading={submitting} className="mt-2">
          Simpan Kata Sandi
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-charcoal-soft">
        Butuh bantuan?{" "}
        <a
          href="mailto:hello@tensimenu.id"
          className="font-semibold text-brand-primary underline-offset-4 transition-colors duration-150 hover:text-brand-primary-dark hover:underline"
        >
          Hubungi Dukungan
        </a>
      </p>
    </div>
  );
}
