"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StepIndicator from "./StepIndicator";
import Step1Physical from "./Step1Physical";
import Step2Medical from "./Step2Medical";
import Step3Preferences from "./Step3Preferences";
import Step4Confirm from "./Step4Confirm";
import type { ProfileFormData } from "./types";
import { INITIAL_FORM_DATA } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STEPS = [
  { id: 1, label: "Profil" },
  { id: 2, label: "Medis" },
  { id: 3, label: "Selera" },
  { id: 4, label: "Selesai" },
] as const;

interface ProfileWizardProps {
  /** Initial data jika user sedang edit profil yang sudah ada */
  initialData?: Partial<ProfileFormData>;
  /** Mode: onboarding (first time) atau edit */
  mode?: "onboarding" | "edit";
}

/**
 * Multi-step wizard untuk Profile Onboarding.
 *
 * Step 1: Data Fisik (nama, usia, gender, BB, TB)
 * Step 2: Kondisi Medis (BP, komorbid)
 * Step 3: Preferensi Makanan (pantangan, regional)
 * Step 4: Avatar + Konfirmasi (preview target nutrisi)
 */
export default function ProfileWizard({
  initialData,
  mode = "onboarding",
}: ProfileWizardProps) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProfileFormData>({
    ...INITIAL_FORM_DATA,
    full_name: session?.user?.name ?? INITIAL_FORM_DATA.full_name,
    ...initialData,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateStep = (s: number): boolean => {
    const next: Partial<Record<keyof ProfileFormData, string>> = {};

    if (s === 1) {
      // Nama
      if (!data.full_name.trim()) {
        next.full_name = "Nama wajib diisi";
      } else if (data.full_name.trim().length < 2) {
        next.full_name = "Nama minimal 2 karakter";
      }

      // Usia
      if (data.age === "" || data.age === null || data.age === undefined) {
        next.age = "Usia wajib diisi";
      } else if (typeof data.age === "number") {
        if (data.age < 18) next.age = "Usia minimal 18 tahun";
        else if (data.age > 90) next.age = "Usia maksimal 90 tahun";
      }

      // Gender
      if (!data.gender) {
        next.gender = "Pilih jenis kelamin";
      }

      // Berat Badan
      if (
        data.weight_kg === "" ||
        data.weight_kg === null ||
        data.weight_kg === undefined
      ) {
        next.weight_kg = "Berat badan wajib diisi";
      } else if (typeof data.weight_kg === "number") {
        if (data.weight_kg < 20) next.weight_kg = "BB terlalu kecil";
        else if (data.weight_kg > 300) next.weight_kg = "BB terlalu besar";
      }

      // Tinggi Badan
      if (
        data.height_cm === "" ||
        data.height_cm === null ||
        data.height_cm === undefined
      ) {
        next.height_cm = "Tinggi badan wajib diisi";
      } else if (typeof data.height_cm === "number") {
        if (data.height_cm < 100) next.height_cm = "TB terlalu kecil";
        else if (data.height_cm > 250) next.height_cm = "TB terlalu besar";
      }
    }

    if (s === 2) {
      // BP opsional, tapi kalau diisi harus valid range
      if (
        typeof data.systolic_bp === "number" &&
        (data.systolic_bp < 70 || data.systolic_bp > 250)
      ) {
        next.systolic_bp = "Sistolik harus 70-250 mmHg";
      }
      if (
        typeof data.diastolic_bp === "number" &&
        (data.diastolic_bp < 40 || data.diastolic_bp > 150)
      ) {
        next.diastolic_bp = "Diastolik harus 40-150 mmHg";
      }
      // Sistolik & diastolik harus diisi keduanya atau tidak sama sekali
      const hasS = typeof data.systolic_bp === "number";
      const hasD = typeof data.diastolic_bp === "number";
      if (hasS !== hasD) {
        if (!hasS)
          next.systolic_bp = "Isi sistolik juga, atau kosongkan keduanya";
        if (!hasD)
          next.diastolic_bp = "Isi diastolik juga, atau kosongkan keduanya";
      }

      // Komorbid wajib pilih minimal satu (termasuk "tidak ada")
      if (!data.comorbidities || data.comorbidities.length === 0) {
        next.comorbidities = "Pilih kondisi kesehatan Anda (atau Tidak Ada)";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      // Scroll ke top supaya error terlihat
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step < STEPS.length) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    // Validasi ulang semua step sebelum submit
    if (!validateStep(1)) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const accessToken = session?.accessToken;

      // Headers — Authorization opsional (kalau accessToken tidak ada,
      // backend tetap bisa identifikasi user via user_id di body)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const method = mode === "edit" ? "PUT" : "POST";
      const response = await fetch(`${API_URL}/api/v1/profile`, {
        method,
        headers,
        body: JSON.stringify({
          full_name: data.full_name.trim(),
          age: Number(data.age),
          gender: data.gender,
          weight_kg: Number(data.weight_kg),
          height_cm: Number(data.height_cm),
          activity_level: data.activity_level,
          systolic_bp:
            typeof data.systolic_bp === "number" ? data.systolic_bp : null,
          diastolic_bp:
            typeof data.diastolic_bp === "number" ? data.diastolic_bp : null,
          comorbidities: data.comorbidities,
          food_restrictions: data.food_restrictions,
          regional_prefs: data.regional_prefs,
          avatar_style: data.avatar_style,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        if (response.status === 401) {
          setSubmitError(
            "Sesi telah berakhir. Silakan tutup tab dan login ulang."
          );
          return;
        }

        if (response.status === 409) {
          // Profil sudah ada → coba update saja
          const retryResponse = await fetch(`${API_URL}/api/v1/profile`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
              full_name: data.full_name.trim(),
              age: Number(data.age),
              gender: data.gender,
              weight_kg: Number(data.weight_kg),
              height_cm: Number(data.height_cm),
              activity_level: data.activity_level,
              systolic_bp:
                typeof data.systolic_bp === "number"
                  ? data.systolic_bp
                  : null,
              diastolic_bp:
                typeof data.diastolic_bp === "number"
                  ? data.diastolic_bp
                  : null,
              comorbidities: data.comorbidities,
              food_restrictions: data.food_restrictions,
              regional_prefs: data.regional_prefs,
              avatar_style: data.avatar_style,
            }),
          });
          if (retryResponse.ok) {
            await updateSession({ name: data.full_name.trim() });
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }

        const errorMsg =
          body?.detail?.error ||
          (typeof body?.detail === "string" ? body.detail : null) ||
          "Gagal menyimpan profil. Silakan coba lagi.";
        setSubmitError(errorMsg);
        return;
      }

      // Sukses → update session dengan nama baru lalu redirect
      await updateSession({ name: data.full_name.trim() });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitError(
        "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Step indicator */}
      <div className="mb-6">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {/* Card berisi step content */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-brand-charcoal/5 p-5 shadow-glass-md md:p-7">
        {submitError && (
          <Alert variant="error" className="mb-4">
            {submitError}
          </Alert>
        )}

        {/* Show error untuk komorbid (di luar step component karena tidak ada error slot di Step2) */}
        {step === 2 && errors.comorbidities && (
          <Alert variant="error" className="mb-4">
            {errors.comorbidities}
          </Alert>
        )}

        {step === 1 && (
          <Step1Physical data={data} errors={errors} onChange={updateField} />
        )}
        {step === 2 && (
          <Step2Medical data={data} errors={errors} onChange={updateField} />
        )}
        {step === 3 && <Step3Preferences data={data} onChange={updateField} />}
        {step === 4 && <Step4Confirm data={data} onChange={updateField} />}

        {/* Navigation buttons */}
        <div className="mt-7 flex items-center justify-between gap-3 border-t border-brand-charcoal/5 pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          {step < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} loading={submitting}>
              {!submitting && (
                <>
                  Simpan & Mulai
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Step counter mobile */}
      <p className="mt-4 text-center text-xs text-brand-charcoal-muted sm:hidden">
        Langkah {step} dari {STEPS.length}
      </p>
    </div>
  );
}
