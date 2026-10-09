import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * CRICZONE — Tailwind class merger.
 * Used by every shadcn/ui component and our own composites.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}