import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TemplateToggles } from "./template-toggles";

export const metadata = { title: "CV Templates" };

export default async function AdminCvTemplatesPage() {
  await requirePermissionPage("cv:templates");
  const templates = await db.cVTemplate.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        title="CV templates"
        description="The template library available to users. Activation and premium status are live — Career Forge's render engine (both the on-screen preview and PDF export) reads each template's layout config directly, so a new template needs no code changes."
      />
      {templates.length === 0 ? (
        <EmptyState title="No templates yet" description="Run the seed to load the starter set." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{t.name}</p>
                  {t.isPremium ? <Badge>Premium</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                <Badge variant={t.isActive ? "success" : "secondary"} className="mt-3">
                  {t.isActive ? "Active" : "Inactive"}
                </Badge>
                <TemplateToggles id={t.id} isActive={t.isActive} isPremium={t.isPremium} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
