"use client";

import { Heart, Activity, Stethoscope, Droplet, Scale, Info } from "lucide-react";

import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import SelectableCard from "./SelectableCard";
import type { ProfileFormData, Comorbidity } from "./types";
import { COMORBIDITY_LABELS } from "./types";

interface Step2Props {
  data: ProfileFormData;
  errors: Partial<Record<keyof ProfileFormData, string>>;
  onChange: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => void;
}

const COMORBIDITY_OPTIONS: {
  value: Comorbidity;
  icon: typeof Activity;
  description: string;
}[] = [
  {
    value: "tidak_ada",
    icon: Heart,
    description: "Saya tidak memiliki riwayat penyakit penyerta",
  },
  {
    value: "diabetes_t2",
    icon: Droplet,
    description: "Gula darah sulit terkontrol",
  },
  {
    value: "ckd",
    icon: Activity,
    description: "Penyakit ginjal kronis",
  },
  {
    value: "dyslipidemia",
    icon: Stethoscope,
    description: "Kolesterol atau trigliserida tinggi",
  },
  {
    value: "obesity",
    icon: Scale,
    description: "Indeks massa tubuh > 30",
  },
];

/**
 * Step 2: Kondisi Medis
 * Field: tekanan darah sistolik & diastolik, komorbid (multi-select).
 */
export default function Step2Medical({ data, errors, onChange }: Step2Props) {
  const isCritical =
    typeof data.systolic_bp === "number" &&
    typeof data.diastolic_bp === "number" &&
    (data.systolic_bp >= 180 || data.diastolic_bp >= 120);

  const toggleComorbidity = (value: Comorbidity) => {
    const current = data.comorbidities;
    let next: Comorbidity[];

    if (value === "tidak_ada") {
      // "Tidak Ada" mutually exclusive dengan yang lain
      next = current.includes("tidak_ada") ? [] : ["tidak_ada"];
    } else {
      // Hapus "tidak_ada" jika user pilih komorbid lain
      const withoutNone = current.filter((c) => c !== "tidak_ada");
      next = withoutNone.includes(value)
        ? withoutNone.filter((c) => c !== value)
        : [...withoutNone, value];
    }

    onChange("comorbidities", next);
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-charcoal md:text-2xl">
          Bagaimana kondisi kesehatan Anda?
        </h2>
        <p className="mt-1 text-sm text-brand-charcoal-soft">
          Informasi ini akan disimpan dengan aman dan hanya digunakan untuk
          personalisasi rekomendasi.
        </p>
      </div>

      {/* Tekanan Darah */}
      <div>
        <p className="mb-3 text-sm font-medium text-brand-charcoal">
          Tekanan Darah Terakhir
          <span className="ml-1.5 text-xs font-normal text-brand-charcoal-muted">
            (opsional)
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Sistolik"
            htmlFor="systolic_bp"
            error={errors.systolic_bp}
            hint="70-250 mmHg"
          >
            <Input
              id="systolic_bp"
              type="number"
              min={70}
              max={250}
              placeholder="120"
              leftIcon={<Heart className="h-4 w-4" />}
              value={data.systolic_bp}
              onChange={(e) =>
                onChange(
                  "systolic_bp",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              hasError={!!errors.systolic_bp}
            />
          </FormField>

          <FormField
            label="Diastolik"
            htmlFor="diastolic_bp"
            error={errors.diastolic_bp}
            hint="40-150 mmHg"
          >
            <Input
              id="diastolic_bp"
              type="number"
              min={40}
              max={150}
              placeholder="80"
              leftIcon={<Heart className="h-4 w-4" />}
              value={data.diastolic_bp}
              onChange={(e) =>
                onChange(
                  "diastolic_bp",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              hasError={!!errors.diastolic_bp}
            />
          </FormField>
        </div>

        {/* Info card — empati & edukasi */}
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-brand-primary/15 bg-brand-primary/5 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-brand-primary" />
          <div className="text-xs leading-relaxed text-brand-charcoal-soft">
            <span className="font-semibold text-brand-charcoal">
              Untuk hasil yang lebih akurat,
            </span>{" "}
            sebaiknya cantumkan nilai tekanan darah Anda. Data ini membantu
            kami memberikan target nutrisi yang sesuai dengan kondisi
            kesehatan Anda. Belum tahu nilainya? Anda bisa mencatatnya kapan
            saja di halaman <span className="font-medium">Riwayat TD</span>.
          </div>
        </div>

        {isCritical && (
          <Alert variant="error" className="mt-3">
            Tekanan darah Anda di atas ambang krisis hipertensi. Segera
            konsultasi ke tenaga medis untuk evaluasi lebih lanjut.
          </Alert>
        )}
      </div>

      {/* Komorbid */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-brand-charcoal">
          Riwayat Penyakit Penyerta (Komorbid)
        </legend>
        <p className="mb-3 text-xs text-brand-charcoal-soft">
          Pilih semua yang sesuai. Bisa lebih dari satu.
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {COMORBIDITY_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              mode="checkbox"
              selected={data.comorbidities.includes(opt.value)}
              onToggle={() => toggleComorbidity(opt.value)}
              label={COMORBIDITY_LABELS[opt.value]}
              description={opt.description}
              icon={<opt.icon className="h-4 w-4" />}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
