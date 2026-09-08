import { requirePermissionPage } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getMaintenance, MAINTENANCE_SECTIONS } from "@/lib/maintenance/service";
import { MaintenanceForm } from "./maintenance-form";

export const metadata = { title: "Maintenance mode" };

export default async function AdminMaintenancePage() {
  await requirePermissionPage("settings:write");
  const state = await getMaintenance();

  const sections = (Object.keys(MAINTENANCE_SECTIONS) as (keyof typeof MAINTENANCE_SECTIONS)[]).map((key) => ({
    key,
    label: MAINTENANCE_SECTIONS[key],
    off: state[key].off,
    note: state[key].note,
  }));

  return (
    <div>
      <PageHeader
        title="Maintenance mode"
        description="Pause a public section of the site and show visitors a notice while you work on it. The rest of the site keeps running, and staff still see the real pages. Enrolled learners keep access to their content."
      />
      <Card>
        <CardContent className="p-6">
          <MaintenanceForm sections={sections} />
        </CardContent>
      </Card>
    </div>
  );
}
