import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: readonly { readonly id: number; readonly label: string }[];
  currentStep: number;
}

/**
 * Visual progress indikator untuk wizard. Menampilkan setiap step
 * dengan status: completed (check), current (highlighted), upcoming (muted).
 */
export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progres" className="w-full">
      <ol className="flex items-center gap-2 md:gap-3">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = idx === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center",
                !isLast && "flex-1"
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                    isCompleted &&
                      "bg-brand-primary text-white shadow-sm",
                    isCurrent &&
                      "bg-brand-primary text-white shadow-brand-cta ring-4 ring-brand-primary/15",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-white text-brand-charcoal-muted ring-1 ring-brand-charcoal/10"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide uppercase whitespace-nowrap transition-colors duration-300 hidden sm:block",
                    (isCompleted || isCurrent)
                      ? "text-brand-primary"
                      : "text-brand-charcoal-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-1.5 h-0.5 flex-1 rounded-full transition-colors duration-300 mb-5 sm:mb-5",
                    isCompleted
                      ? "bg-brand-primary"
                      : "bg-brand-charcoal/10"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
