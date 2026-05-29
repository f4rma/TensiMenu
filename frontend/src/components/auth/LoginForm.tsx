"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import GoogleButton from "./GoogleButton";
import Divider from "./Divider";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [data, setData] = useState<FormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>(() =>
    errorParam ? { form: "Email atau kata sandi salah" } : {}
  );
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!data.email.trim()) {
      next.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = "Format email tidak valid";
    }
    if (!data.password) {
      next.password = "Kata sandi wajib diisi";
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

    const result = await signIn("credentials", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setErrors({ form: "Email atau kata sandi salah" });
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Selamat Datang Kembali
        </h1>
        <p className="mt-1.5 text-sm text-brand-charcoal-soft">
          Masuk untuk melanjutkan perjalanan kesehatan Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {errors.form && (
          <Alert variant="error">{errors.form}</Alert>
        )}

        <FormField
          label="Alamat Email"
          htmlFor="email"
          required
          error={errors.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
            hasError={!!errors.email}
            disabled={submitting}
          />
        </FormField>

        <FormField
          label="Kata Sandi"
          htmlFor="password"
          required
          error={errors.password}
          className="relative"
        >
          {/* "Lupa kata sandi" link diposisikan di kanan atas label */}
          <Link
            href="/forgot-password"
            className="absolute right-0 top-0 text-xs font-semibold text-brand-primary underline-offset-4 transition-colors duration-150 hover:text-brand-primary-dark hover:underline"
          >
            Lupa kata sandi?
          </Link>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            leftIcon={<Lock className="h-4 w-4" />}
            showPasswordToggle
            value={data.password}
            onChange={(e) => updateField("password", e.target.value)}
            hasError={!!errors.password}
            disabled={submitting}
          />
        </FormField>

        <Button type="submit" fullWidth size="md" loading={submitting} className="mt-2">
          Masuk
        </Button>
      </form>

      <div className="mt-6">
        <Divider label="atau masuk dengan" />
        <div className="mt-4">
          <GoogleButton label="Masuk dengan Google" />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-brand-charcoal-soft">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-primary underline-offset-4 transition-colors duration-150 hover:text-brand-primary-dark hover:underline"
        >
          Daftar Sekarang
        </Link>
      </p>
    </div>
  );
}
