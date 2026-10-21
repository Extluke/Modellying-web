import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Standard utility function for combining Tailwind CSS class names
 * using clsx and tailwind-merge. Required by Shadcn UI.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
