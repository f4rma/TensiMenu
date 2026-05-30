"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Icon di sisi kiri input */
  leftIcon?: ReactNode;
  /** Aktif jika ada error agar border + ring berubah ke rose */
  hasError?: boolean;
  /** Untuk input password — render toggle eye di kanan */
  showPasswordToggle?: boolean;
}

/**
 * Input field dengan style brand TensiMenu — soft glass, brand cream tinted
 * Mendukung leftIcon, error state, dan toggle password.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      leftIcon,
      hasError = false,
      showPasswordToggle = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const effectiveType =
      isPassword && showPasswordToggle && showPassword ? "text" : type;

    const hasRightSlot = isPassword && showPasswordToggle;

    return (
      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal-muted"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          type={effectiveType}
          className={cn(
            "h-11 w-full rounded-xl bg-brand-cream/50 backdrop-blur-sm",
            "border text-sm text-brand-charcoal placeholder:text-brand-charcoal-muted",
            "transition-all duration-150",
            "focus:outline-none focus:bg-white focus:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            // Padding kiri menyesuaikan apakah ada leftIcon
            leftIcon ? "pl-10 pr-3.5" : "px-3.5",
            // Padding kanan menyesuaikan toggle password
            hasRightSlot && "pr-10",
            // Border + ring color
            hasError
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
              : "border-brand-charcoal/10 focus:border-brand-primary focus:ring-brand-primary/20",
            className
          )}
          aria-invalid={hasError || undefined}
          {...props}
        />

        {hasRightSlot && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-brand-charcoal-muted transition-colors duration-150 hover:bg-brand-charcoal/5 hover:text-brand-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
