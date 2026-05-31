"use client";

import { useEffect, useRef, useState } from "react";
import { X, Heart, Calendar, Clock, Save, Loader2 } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import CategoryBadge from "./CategoryBadge";
import { classifyBP } from "./types";

interface BPInputModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    systolic_mmhg: number;
    diastolic_mmhg: number;
    measured_at: string;
    notes?: string;
  }) => Promise<void>;
}

interface FormState {
  systolic: string;
  diastolic: string;
  date: string;
  time: string;
  notes: string;
}

const INITIAL_STATE: FormState = {
  systolic: "",
  diastolic: "",
  date: "",
  time: "",
  notes: "",
};

const NOTES_MAX_LEN = 500;

/**
 * Modal dialog untuk input catatan tekanan darah baru.
 *
 * Validations (Req. 6.2):
 * - Sistolik 70-250 mmHg
 * - Diastolik 40-150 mmHg
 *
 * Smart features:
 * - Default tanggal/waktu = sekarang
 * - Auto-calc kategori real-time saat user input nilai
 * - Warning visual untuk krisis hipertensi (Req. 6.5)
 * - Catatan max 500 karakter dengan counter
 * - Focus trap & ESC to close (a11y)
 */
export default function BPInputModal({
  open,
  onClose,
  onSubmit,
}: BPInputModalProps) {
  const [data, setData] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset form saat modal dibuka, set default ke sekarang
  useEffect(() => {
    if (open) {
      const now = new Date();
      const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setData({ ...INITIAL_STATE, date, time });
      setErrors({});
      setSubmitError(null);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const sysNum = data.systolic ? Number(data.systolic) : null;
  const diaNum = data.diastolic ? Number(data.diastolic) : null;
  const liveCategory =
    sysNum && diaNum && !Number.isNaN(sysNum) && !Number.isNaN(diaNum)
      ? classifyBP(sysNum, diaNum)
      : null;
  const isCritical = liveCategory === "Krisis Hipertensi";

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!data.systolic) next.systolic = "Sistolik wajib diisi";
    else if (sysNum === null || sysNum < 70 || sysNum > 250)
      next.systolic = "Sistolik harus 70-250 mmHg";

    if (!data.diastolic) next.diastolic = "Diastolik wajib diisi";
    else if (diaNum === null || diaNum < 40 || diaNum > 150)
      next.diastolic = "Diastolik harus 40-150 mmHg";

    if (!data.date) next.date = "Tanggal wajib diisi";
    if (!data.time) next.time = "Waktu wajib diisi";

    if (data.notes.length > NOTES_MAX_LEN) {
      next.notes = `Catatan maksimal ${NOTES_MAX_LEN} karakter`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || sysNum === null || diaNum === null) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const measured_at = new Date(`${data.date}T${data.time}:00`).toISOString();
      await onSubmit({
        systolic_mmhg: sysNum,
        diastolic_mmhg: diaNum,
        measured_at,
        notes: data.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan catatan. Silakan coba lagi.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-3xl bg-white shadow-glass-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-brand-charcoal/5 px-5 py-4">
          <h2
            id="bp-modal-title"
            className="text-base font-semibold tracking-tight text-brand-charcoal"
          >
            Pencatatan Tekanan Darah Baru
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-charcoal-soft transition-colors duration-150 hover:bg-brand-charcoal/5 hover:text-brand-charcoal disabled:opacity-40"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4 p-5">
            {submitError && <Alert variant="error">{submitError}</Alert>}

            {/* Live category preview */}
            {liveCategory && (
              <div className="flex items-center gap-2 rounded-xl bg-brand-cream-soft px-3 py-2">
                <span className="text-xs text-brand-charcoal-soft">Kategori:</span>
                <CategoryBadge category={liveCategory} />
              </div>
            )}

            {/* Critical warning (Req. 6.5) */}
            {isCritical && (
              <Alert variant="error">
                <span className="font-semibold">Krisis hipertensi.</span>{" "}
                Segera konsultasi ke tenaga medis untuk evaluasi lebih lanjut.
              </Alert>
            )}

            {/* Sistolik & Diastolik */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Sistolik (mmHg)"
                htmlFor="systolic"
                required
                error={errors.systolic}
              >
                <Input
                  id="systolic"
                  type="number"
                  min={70}
                  max={250}
                  placeholder="70-250"
                  leftIcon={<Heart className="h-4 w-4" />}
                  value={data.systolic}
                  onChange={(e) => updateField("systolic", e.target.value)}
                  hasError={!!errors.systolic}
                  autoFocus
                />
              </FormField>

              <FormField
                label="Diastolik (mmHg)"
                htmlFor="diastolic"
                required
                error={errors.diastolic}
              >
                <Input
                  id="diastolic"
                  type="number"
                  min={40}
                  max={150}
                  placeholder="40-150"
                  leftIcon={<Heart className="h-4 w-4" />}
                  value={data.diastolic}
                  onChange={(e) => updateField("diastolic", e.target.value)}
                  hasError={!!errors.diastolic}
                />
              </FormField>
            </div>

            {/* Tanggal & Waktu */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Tanggal"
                htmlFor="bp-date"
                required
                error={errors.date}
              >
                <Input
                  id="bp-date"
                  type="date"
                  leftIcon={<Calendar className="h-4 w-4" />}
                  value={data.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  hasError={!!errors.date}
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormField>

              <FormField
                label="Waktu"
                htmlFor="bp-time"
                required
                error={errors.time}
              >
                <Input
                  id="bp-time"
                  type="time"
                  leftIcon={<Clock className="h-4 w-4" />}
                  value={data.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  hasError={!!errors.time}
                />
              </FormField>
            </div>

            {/* Notes */}
            <FormField
              label="Catatan (Opsional)"
              htmlFor="bp-notes"
              error={errors.notes}
            >
              <textarea
                id="bp-notes"
                value={data.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Tambahkan catatan tambahan (misal: pusing, setelah olahraga)"
                rows={2}
                maxLength={NOTES_MAX_LEN + 50} // beri ruang untuk warning
                disabled={submitting}
                className="w-full rounded-xl border border-brand-charcoal/10 bg-brand-cream/50 backdrop-blur-sm px-3.5 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-charcoal-muted transition-all duration-150 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none resize-none disabled:opacity-60"
              />
              <p className="mt-1 text-[10px] text-brand-charcoal-muted text-right">
                {data.notes.length} / {NOTES_MAX_LEN} karakter
              </p>
            </FormField>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-brand-charcoal/5 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {!submitting && (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Catatan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
