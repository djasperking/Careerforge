import type { ReactNode } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { maintenanceGate, type MaintenanceSection } from "@/lib/maintenance/service";
import { MaintenanceStaffBanner } from "@/components/maintenance/staff-banner";

/**
 * Page helper. Returns `{ notice }` to early-return when a visitor is blocked,
 * or `{ banner }` to drop in at the top of the page when staff are previewing
 * a paused section. Both null when the section is live.
 */
export async function checkMaintenance(
  section: MaintenanceSection,
): Promise<{ notice: ReactNode | null; banner: ReactNode | null }> {
  const gate = await maintenanceGate(section);
  if (!gate) return { notice: null, banner: null };
  const user = await getCurrentUser();
  if (gate.blocked) {
    return {
      notice: (
        <MaintenanceSectionNotice
          sectionLabel={gate.sectionLabel}
          note={gate.note}
          loggedIn={Boolean(user)}
          wholeSite={gate.sectionLabel === "Whole site"}
        />
      ),
      banner: null,
    };
  }
  return { notice: null, banner: <MaintenanceStaffBanner sectionLabel={gate.sectionLabel} /> };
}

/**
 * Shown to visitors when a section (or the whole site) is in maintenance mode.
 * Keeps the header + footer so the rest of the site stays navigable.
 */
export function MaintenanceSectionNotice({
  sectionLabel,
  note,
  loggedIn = false,
  wholeSite = false,
}: {
  sectionLabel: string;
  note: string;
  loggedIn?: boolean;
  wholeSite?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {wholeSite ? null : <MarketingHeader loggedIn={loggedIn} />}
      <main className="container flex flex-1 items-center justify-center py-20">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wrench className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">
            {wholeSite ? "We'll be right back" : `${sectionLabel} is being updated`}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{note}</p>
          {!wholeSite ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm" variant="outline"><Link href="/">Back to home</Link></Button>
              {loggedIn ? (
                <Button asChild size="sm"><Link href="/dashboard">Go to your dashboard</Link></Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
      {wholeSite ? null : <SiteFooter />}
    </div>
  );
}
