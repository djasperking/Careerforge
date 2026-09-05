import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { AiToolsTabs } from "./ai-tools-tabs";

export const metadata = { title: "AI Career Tools" };

export default async function AIToolsPage() {
  const user = await requireUser();
  const cvs = await db.cV.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="AI Career Tools" description="AI assistance for every step of your career." />
      <AiToolsTabs cvs={cvs} />
    </div>
  );
}
