import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { parseCvContent } from "@/lib/cv/schema";
import { CvEditor } from "./cv-editor";
import { VersionHistory } from "./version-history";

export default async function CVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [cv, templates] = await Promise.all([
    db.cV.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: { versions: { orderBy: { version: "desc" }, take: 10 } },
    }),
    db.cVTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!cv) notFound();

  return (
    <div>
      <CvEditor
        cvId={cv.id}
        initialTitle={cv.title}
        initialTemplateId={cv.templateId}
        initialContent={parseCvContent(cv.content)}
        templates={templates.map((t) => ({ id: t.id, key: t.key, name: t.name, isPremium: t.isPremium, config: t.config }))}
      />
      <VersionHistory
        cvId={cv.id}
        versions={cv.versions.map((v) => ({ version: v.version, reason: v.reason, createdAt: v.createdAt.toISOString() }))}
      />
    </div>
  );
}
