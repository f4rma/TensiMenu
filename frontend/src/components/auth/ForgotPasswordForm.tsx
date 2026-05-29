"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      // Untuk keamanan, selalu tampilkan pesan sukses bahkan jika email tidak ditemukan
      // (mencegah email enumeration attack)
      if (response.ok || response.status === 404) {
        setSuccess(true);
      } else {
        setError("Terjadi kesalahan. Silakan coba beberapa saat lagi.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Tautan Terkirim
        </h1>
        <p className="mt-1.5 text-sm text-brand-charcoal-soft">
          Jika email tersebut terdaftar, kami telah mengirimkan tautan reset
          kata sandi. Periksa kotak masuk Anda dalam beberapa menit.
        </p>

        <Alert variant="success" className="mt-5">
          Tautan reset kata sandi berlaku selama 60 menit.
        </Alert>

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline-offset-4 transition-colors duration-150 hover:text-brand-primary-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-primary md:text-3xl">
          Lupa Kata Sandi?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-charcoal-soft">
          Masukkan email kamu dan kami akan mengirimkan tautan untuk mengatur
          ulang kata sandi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <FormField label="Email" htmlFor="forgot-email" required>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hasError={!!error}
            disabled={submitting}
          />
        </FormField>

        <Button type="submit" fullWidth size="md" loading={submitting} className="mt-2">
          {!submitting && (
            <>
              Kirim Tautan Reset
              <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-charcoal-soft transition-colors duration-150 hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
