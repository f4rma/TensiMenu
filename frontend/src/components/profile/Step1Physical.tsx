"use client";

import { User, Calendar, Weight, Ruler, Activity } from "lucide-react";

import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import SelectableCard from "./SelectableCard";
import type { ProfileFormData, Gender, ActivityLevel } from "./types";
import {
  ACTIVITY_LEVEL_LABELS,
  ACTIVITY_LEVEL_DESCRIPTIONS,
} from "./types";

interface Step1Props {
  data: ProfileFormData;
  errors: Partial<Record<keyof ProfileFormData, string>>;
  onChange: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => void;
}

const GENDER_OPTIONS: { value: Gender; label: string; description: string }[] = [
  {
    value: "laki-laki",
    label: "Laki-laki",
    description: "Pria",
  },
  {
    value: "perempuan",
    label: "Perempuan",
    description: "Wanita",
  },
];

const ACTIVITY_OPTIONS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

/**
 * Step 1: Data Fisik
 * Field: nama, usia, jenis kelamin, berat badan, tinggi badan.
 */
export default function Step1Physical({ data, errors, onChange }: Step1Props) {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-charcoal md:text-2xl">
          Mari kenalan dulu
        </h2>
        <p className="mt-1 text-sm text-brand-charcoal-soft">
          Data ini membantu kami menghitung kebutuhan nutrisi personal Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormField
          label="Nama Lengkap"
          htmlFor="full_name"
          required
          error={errors.full_name}
        >
          <Input
            id="full_name"
            type="text"
            placeholder="Masukkan nama lengkap"
            leftIcon={<User className="h-4 w-4" />}
            value={data.full_name}
            onChange={(e) => onChange("full_name", e.target.value)}
            hasError={!!errors.full_name}
            autoComplete="name"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Usia" htmlFor="age" required error={errors.age}>
            <Input
              id="age"
              type="number"
              min={18}
              max={90}
              placeholder="35"
              leftIcon={<Calendar className="h-4 w-4" />}
              value={data.age}
              onChange={(e) =>
                onChange("age", e.target.value === "" ? "" : Number(e.target.value))
              }
              hasError={!!errors.age}
            />
          </FormField>
          <div className="flex items-end">
            <p className="pb-3 text-xs text-brand-charcoal-muted">tahun</p>
          </div>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-brand-charcoal">
          Jenis Kelamin <span className="text-rose-500">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              mode="radio"
              selected={data.gender === opt.value}
              onToggle={() => onChange("gender", opt.value)}
              label={opt.label}
              description={opt.description}
              icon={<User className="h-4 w-4" />}
            />
          ))}
        </div>
        {errors.gender && (
          <p role="alert" className="text-xs text-rose-600 mt-1">
            {errors.gender}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Berat Badan"
          htmlFor="weight_kg"
          required
          error={errors.weight_kg}
          hint="kg"
        >
          <Input
            id="weight_kg"
            type="number"
            min={20}
            max={300}
            step={0.1}
            placeholder="65"
            leftIcon={<Weight className="h-4 w-4" />}
            value={data.weight_kg}
            onChange={(e) =>
              onChange(
                "weight_kg",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            hasError={!!errors.weight_kg}
          />
        </FormField>

        <FormField
          label="Tinggi Badan"
          htmlFor="height_cm"
          required
          error={errors.height_cm}
          hint="cm"
        >
          <Input
            id="height_cm"
            type="number"
            min={100}
            max={250}
            step={0.5}
            placeholder="170"
            leftIcon={<Ruler className="h-4 w-4" />}
            value={data.height_cm}
            onChange={(e) =>
              onChange(
                "height_cm",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            hasError={!!errors.height_cm}
          />
        </FormField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-brand-charcoal">
          Tingkat Aktivitas <span className="text-rose-500">*</span>
        </legend>
        <p className="mb-2 text-xs text-brand-charcoal-soft">
          Untuk menghitung kebutuhan energi harian Anda secara realistis.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt}
              mode="radio"
              selected={data.activity_level === opt}
              onToggle={() => onChange("activity_level", opt)}
              label={ACTIVITY_LEVEL_LABELS[opt]}
              description={ACTIVITY_LEVEL_DESCRIPTIONS[opt]}
              icon={<Activity className="h-4 w-4" />}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
