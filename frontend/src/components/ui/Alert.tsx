import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "info" | "warning";

interface AlertProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const VARIANTS: Record<
  Variant,
  { container: string; icon: typeof AlertCircle; iconColor: string }
> = {
  error: {
    container: "bg-rose-50 border-rose-200 text-rose-800",
    icon: AlertCircle,
    iconColor: "text-rose-500",
  },
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  info: {
    container: "bg-sky-50 border-sky-200 text-sky-800",
    icon: Info,
    iconColor: "text-sky-600",
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
};

export default function Alert({
  variant = "info",
  children,
  className,
}: AlertProps) {
  const { container, icon: Icon, iconColor } = VARIANTS[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        container,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", iconColor)} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
