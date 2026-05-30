import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose Tailwind classes safely — combines clsx (conditional classes)
 * dengan tailwind-merge (resolusi konflik utility).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
