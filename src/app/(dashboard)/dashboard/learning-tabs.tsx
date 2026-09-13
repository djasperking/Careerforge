import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/exams", label: "Exams" },
  { href: "/dashboard/certificates", label: "Certificates" },
] as const;

/** Shared tab bar for the merged "Learning" nav entry — Exams and
 * Certificates stay separate routes, but read as one section. */
export function LearningTabs({ active }: { active: "exams" | "certificates" }) {
  return (
    <div className="mb-6 flex gap-1 border-b">
      {TABS.map((t) => {
        const isActive = t.href.endsWith(active);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
