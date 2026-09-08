import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";

/**
 * Per-section maintenance mode. An admin can pause a public area of the site
 * (jobs, marketplace, courses…) and show visitors a friendly notice with a
 * custom message, without touching the rest of the site or a deploy.
 *
 * Scope note: this only gates the PUBLIC discovery/marketing pages and new
 * purchases. Enrolled learners keep access to their dashboard content, and
 * staff always see the real page (with a banner).
 */

export const MAINTENANCE_SECTIONS = {
  site: "Whole site",
  jobs: "Jobs board",
  products: "Digital products",
  courses: "Courses",
  coaching: "Coaching",
  blog: "Blog",
} as const;

export type MaintenanceSection = keyof typeof MAINTENANCE_SECTIONS;

export type SectionState = { off: boolean; note: string };

const DEFAULT_NOTE = "We're making some improvements to this section. It'll be back shortly — thanks for your patience.";

const SETTING_KEY = "maintenance";

function normalize(raw: unknown): Record<MaintenanceSection, SectionState> {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = {} as Record<MaintenanceSection, SectionState>;
  for (const key of Object.keys(MAINTENANCE_SECTIONS) as MaintenanceSection[]) {
    const v = (obj[key] ?? {}) as Record<string, unknown>;
    out[key] = {
      off: v.off === true,
      note: typeof v.note === "string" && v.note.trim() ? v.note.trim().slice(0, 600) : "",
    };
  }
  return out;
}

export async function getMaintenance(): Promise<Record<MaintenanceSection, SectionState>> {
  const row = await db.systemSetting.findUnique({ where: { key: SETTING_KEY } });
  return normalize(row?.value);
}

export async function saveMaintenance(
  next: Partial<Record<MaintenanceSection, SectionState>>,
  adminId: string,
): Promise<void> {
  const current = await getMaintenance();
  const merged = { ...current };
  for (const key of Object.keys(MAINTENANCE_SECTIONS) as MaintenanceSection[]) {
    if (next[key]) {
      merged[key] = {
        off: next[key]!.off === true,
        note: (next[key]!.note ?? "").trim().slice(0, 600),
      };
    }
  }
  await db.systemSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: merged as never, updatedBy: adminId },
    update: { value: merged as never, updatedBy: adminId },
  });
}

export type MaintenanceGate = {
  /** true → show the visitor notice instead of the page */
  blocked: boolean;
  /** true → caller is staff; render the real page plus a warning banner */
  staffPreview: boolean;
  note: string;
  sectionLabel: string;
};

/**
 * Resolve maintenance for a section. `site` mode overrides every section.
 * Returns null when the section is live for everyone.
 */
export async function maintenanceGate(section: MaintenanceSection): Promise<MaintenanceGate | null> {
  const state = await getMaintenance();
  const active = state.site.off ? { key: "site" as const, ...state.site } : state[section].off ? { key: section, ...state[section] } : null;
  if (!active) return null;

  const user = await getCurrentUser();
  const staff = Boolean(user && isAdminRole(user.roles));
  const note = active.note || DEFAULT_NOTE;

  return {
    blocked: !staff,
    staffPreview: staff,
    note,
    sectionLabel: MAINTENANCE_SECTIONS[active.key],
  };
}

/** For server actions (checkout, enrol) — throw-free boolean check, no staff bypass concept needed at the action layer beyond this. */
export async function isSectionPaused(section: MaintenanceSection): Promise<boolean> {
  const state = await getMaintenance();
  return state.site.off || state[section].off;
}
