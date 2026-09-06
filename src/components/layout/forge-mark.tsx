import { cn } from "@/lib/utils";

/** The Career Forge brand mark — a forged flame. Kept in sync with src/app/icon.svg. */
export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-6", className)} aria-hidden>
      <path
        d="M16.6 4.5c.9 4.7 6 7.1 6 12.4a6.6 6.6 0 0 1-13.2 0c0-1.9.6-3.4 1.8-4.8.3 2 1.6 3.1 3 3.1-1.6-3.5-.1-7.4 2.4-10.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
