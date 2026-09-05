import { PageHeader } from "@/components/ui/page-header";
import { PhaseNotice } from "@/components/ui/phase-notice";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Placeholder for an admin section whose full UI is built in a later phase.
 * The route, the nav entry and the permission guard are already real — only the
 * management screens are pending.
 */
export function AdminStub({
  title,
  description,
  phase,
  scope,
}: {
  title: string;
  description: string;
  phase: string;
  scope: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <PhaseNotice phase={phase}>
        This section is scaffolded (route, navigation and permission guard are live). The management
        screens are implemented in {phase}.
      </PhaseNotice>
      <Card>
        <CardContent className="p-6">
          <p className="mb-2 text-sm font-medium">Planned capabilities</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {scope.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
