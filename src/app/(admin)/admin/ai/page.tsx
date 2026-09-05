import { requirePermissionPage } from "@/lib/session";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Bot } from "lucide-react";
import { PromptManager } from "./prompt-manager";

export const metadata = { title: "AI" };

export default async function AdminAIPage() {
  await requirePermissionPage("ai:config");
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [requests, errors, prompts] = await Promise.all([
    db.aIRequest.count({ where: { createdAt: { gte: since30 } } }),
    db.aIRequest.count({ where: { createdAt: { gte: since30 }, status: "error" } }),
    db.aIPrompt.findMany({ orderBy: [{ key: "asc" }, { version: "desc" }] }),
  ]);

  return (
    <div>
      <PageHeader title="AI management" description="Providers, models, limits and prompts." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active provider" value={env.AI_PROVIDER} icon={Bot} />
        <StatCard label="Model" value={env.AI_MODEL} />
        <StatCard label="Requests (30d)" value={requests} hint={`${errors} errors`} />
        <StatCard label="Stored prompts" value={prompts.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Version and activate custom instructions per AI feature. Career Forge&apos;s safety rules
            (never fabricate history, mark AI-generated content) always apply on top, regardless of what
            you configure here.
          </p>
        </CardHeader>
        <CardContent>
          <PromptManager prompts={prompts} />
        </CardContent>
      </Card>
    </div>
  );
}
