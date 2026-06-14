"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { signIn } from "next-auth/react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import GoogleButton from "./GoogleButton";
import Divider from "./Divider";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  /** Error global non-field (mis. backend error) */
  form?: string;
}

const INITIAL_DATA: FormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm() {
  const router = useRouter();
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    // Clear error untuk field yang sedang diedit
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!data.fullName.trim()) {
      next.fullName = "Nama lengkap wajib diisi";
    } else if (data.fullName.trim().length < 2) {
      next.fullName = "Nama minimal 2 karakter";
    }

    if (!data.email.trim()) {
      next.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = "Format email tidak valid";
    }

    if (!data.password) {
      next.password = "Kata sandi wajib diisi";
    } else if (data.password.length < 8) {
      next.password = "Kata sandi minimal 8 karakter";
    }

    if (!data.confirmPassword) {
      next.confirmPassword = "Konfirmasi kata sandi wajib diisi";
    } else if (data.password !== data.confirmPassword) {
      next.confirmPassword = "Kata sandi tidak cocok";
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: "Email sudah terdaftar" });
        } else if (response.status === 422) {
          const body = await response.json().catch(() => null);
          setErrors({
            form:
              body?.detail?.[0]?.msg ??
              "Data tidak valid. Periksa kembali isian Anda.",
          });
        } else {
          // Backend gagal (mis. admin API Supabase error) → kemungkinan
          // akun sudah dibuat tapi email konfirmasi perlu diklik dulu
          setRegisteredEmail(data.email.trim().toLowerCase());
          setEmailSent(true);
        }
        return;
      }

      // Sukses dengan auto-login — backend return access_token
      const authData = await response.json();

      if (authData.access_token) {
        // Buat NextAuth session yang proper via signIn credentials
        const result = await signIn("credentials", {
          email: data.email.trim().toLowerCase(),
          password: data.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/profile?onboarding=1");
          return;
        }
      }

      // Fallback: backend return sukses tapi session tidak terbentuk
      // (mis. email konfirmasi diperlukan)
      setRegisteredEmail(data.email.trim().toLowerCase());
      setEmailSent(true);
    } catch {
      setErrors({
        form: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Tampilan sukses — instruksikan user untuk cek email
  if (emailSent) {
    return (
      <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-primary/10">
            <Mail className="h-8 w-8 text-brand-primary" strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-brand-charcoal">
            Periksa email Anda
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-brand-charcoal-soft">
            Kami mengirimkan tautan verifikasi ke{" "}
            <span className="font-semibold text-brand-charcoal">
              {registeredEmail}
            </span>
            . Klik tautan tersebut untuk mengaktifkan akun dan mulai menggunakan TensiMenu.
          </p>
          <p className="mt-3 text-xs text-brand-charcoal-muted">
            Tidak menerima email? Periksa folder spam atau{" "}
            <Link
              href="/login"
              className="font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              coba login
            </Link>{" "}
            jika akun sudah aktif.
          </p>
        </div>

        <div className="mt-8 border-t border-brand-charcoal/5 pt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-brand-primary underline-offset-4 transition-colors duration-150 hover:text-brand-primary-dark hover:underline"
          >
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Buat Akun Baru
        </h1>
        <p className="mt-1.5 text-sm text-brand-charcoal-soft">
          Silakan isi data diri Anda untuk memulai.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {errors.form && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
          >
            <span>{errors.form}</span>
          </div>
        )}

        <FormField
          label="Nama Lengkap"
          htmlFor="fullName"
          required
          error={errors.fullName}
        >
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Masukkan nama lengkap"
            value={data.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            hasError={!!errors.fullName}
            disabled={submitting}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
            hasError={!!errors.email}
            disabled={submitting}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Kata Sandi"
            htmlFor="password"
            required
            error={errors.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 karakter"
              showPasswordToggle
              value={data.password}
              onChange={(e) => updateField("password", e.target.value)}
              hasError={!!errors.password}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Konfirmasi Sandi"
            htmlFor="confirmPassword"
            required
            error={errors.confirmPassword}
          >
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi"
              showPasswordToggle
              value={data.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              hasError={!!errors.confirmPassword}
              disabled={submitting}
            />
          </FormField>
        </div>

        <Button type="submit" fullWidth size="md" loading={submitting} className="mt-2">
          {!submitting && (
            <>
              Daftar Sekarang
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6">
        <Divider label="atau daftar dengan" />
        <div className="mt-4">
          <GoogleButton label="Daftar dengan Google" />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-brand-charcoal-soft">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-primary underline-offset-4 transition-colors duration-150 hover:text-brand-primary-dark hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
