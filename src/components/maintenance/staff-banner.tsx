import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/** Thin bar shown to staff on a section that visitors currently can't see. */
export function MaintenanceStaffBanner({ sectionLabel }: { sectionLabel: string }) {
  return (
    <div className="border-b border-warning/30 bg-warning/10">
      <div className="container flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <AlertTriangle className="size-3.5 text-warning" />
          {sectionLabel} is in maintenance mode — visitors see a notice, not this page.
        </span>
        <Link href="/admin/maintenance" className="font-medium text-primary hover:underline">
          Manage
        </Link>
      </div>
    </div>
  );
}
