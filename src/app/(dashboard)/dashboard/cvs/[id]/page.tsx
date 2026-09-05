import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { parseCvContent } from "@/lib/cv/schema";
import { cvHasCleanExport, cvUnlockPrice } from "@/lib/cv/service";
import { formatCurrency } from "@/lib/utils";
import { CvEditor } from "./cv-editor";
import { VersionHistory } from "./version-history";

export default async function CVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const cv = await db.cV.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 10 } },
  });
  if (!cv) notFound();

  const [templates, cleanExport, price] = await Promise.all([
    db.cVTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    cvHasCleanExport(user.id, cv),
    cvUnlockPrice(),
  ]);

  return (
    <div>
      <CvEditor
        cvId={cv.id}
        initialTitle={cv.title}
        initialTemplateId={cv.templateId}
        initialContent={parseCvContent(cv.content)}
        templates={templates.map((t) => ({ id: t.id, key: t.key, name: t.name, isPremium: t.isPremium, config: t.config }))}
        cleanExport={cleanExport}
        unlockPriceLabel={formatCurrency(price.amountCents, price.currency)}
      />
      <VersionHistory
        cvId={cv.id}
        versions={cv.versions.map((v) => ({ version: v.version, reason: v.reason, createdAt: v.createdAt.toISOString() }))}
      />
    </div>
  );
}
