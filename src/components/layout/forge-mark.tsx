import { cn } from "@/lib/utils";

/** The Career Forge brand mark — a forged flame. Kept in sync with src/app/icon.svg. */
export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-6", className)} aria-hidden>
      <path
        d="M16.3 8.3c.8 3.8 4.8 5.8 4.8 9.9a5.1 5.1 0 0 1-10.2 0c0-1.6.5-2.9 1.4-3.8.3 1.6 1.3 2.6 2.2 2.6-1.3-2.9 0-5.8 1.8-8.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
