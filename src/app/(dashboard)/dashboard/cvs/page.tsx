import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { scoreCvCompleteness, parseCvContent } from "@/lib/cv/schema";
import { formatDate } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { NewCvControl } from "./new-cv-control";

export const metadata = { title: "CV Builder" };

export default async function CVsPage() {
  const user = await requireUser();
  const [cvs, templates] = await Promise.all([
    db.cV.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { template: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.cVTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="My CVs"
        description="Create, edit and export AI-assisted CVs."
        action={
          <div className="flex flex-col items-end gap-2">
            <NewCvControl templates={templates.map((t) => ({ id: t.id, name: t.name, isPremium: t.isPremium }))} />
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/cvs/import">
                <Upload className="size-4" /> Import &amp; tailor a CV
              </Link>
            </Button>
          </div>
        }
      />

      {cvs.length === 0 ? (
        <EmptyState icon={FileText} title="No CVs yet" description="Create your first CV to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => {
            const completeness = scoreCvCompleteness(parseCvContent(cv.content));
            return (
              <Link key={cv.id} href={`/dashboard/cvs/${cv.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{cv.title}</p>
                      <Badge variant={completeness >= 80 ? "success" : "secondary"}>{completeness}%</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cv.template?.name ?? "No template"} · Updated {formatDate(cv.updatedAt)}
                    </p>
                    <Button size="sm" variant="outline" className="mt-3" tabIndex={-1}>
                      Open
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6 max-w-sm">
        <AdSlot placement="CV_BUILDER" path="/dashboard/cvs" />
      </div>
    </div>
  );
}
