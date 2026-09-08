import Link from "next/link";
import { FileText, Plus } from "lucide-react";
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

export const metadata = { title: "CV Builder" };

export default async function CVsPage() {
  const user = await requireUser();
  const cvs = await db.cV.findMany({
    where: { userId: user.id, deletedAt: null },
    include: { template: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My CVs"
        description="Every CV on your account. Open one to edit and export it, or start a new one."
        action={
          <Button asChild>
            <Link href="/dashboard/cvs/new">
              <Plus className="size-4" /> New CV
            </Link>
          </Button>
        }
      />

      {cvs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No CVs yet"
          description="Upload an existing CV or start from a template."
          action={
            <Button asChild>
              <Link href="/dashboard/cvs/new">
                <Plus className="size-4" /> New CV
              </Link>
            </Button>
          }
        />
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
