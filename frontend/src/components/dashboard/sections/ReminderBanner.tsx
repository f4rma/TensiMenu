"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";

interface ReminderBannerProps {
  daysSinceLastLog: number;
}

/**
 * Banner pengingat oranye untuk user yang sudah X hari tidak mencatat.
 * Bisa di-dismiss sementara (akan muncul lagi besok).
 */
export default function ReminderBanner({ daysSinceLastLog }: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || daysSinceLastLog < 2) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <Calendar className="h-4 w-4 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-900">
        Kamu belum mencatat makan {daysSinceLastLog} hari. Yuk mulai lagi!
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-700 transition-colors duration-150 hover:bg-amber-100"
        aria-label="Tutup pengingat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
