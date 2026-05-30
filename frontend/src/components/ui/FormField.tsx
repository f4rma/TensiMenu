import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import Label from "./Label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper untuk satu field form: label + input slot + error/hint message
 */
export default function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1 text-xs text-rose-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-brand-charcoal-muted">{hint}</p>
      ) : null}
    </div>
  );
}
