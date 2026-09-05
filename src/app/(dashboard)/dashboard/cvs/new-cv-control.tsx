"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCv } from "./actions";

export function NewCvControl({
  templates,
}: {
  templates: { id: string; name: string; isPremium: boolean }[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const res = await createCv(templateId || null);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/dashboard/cvs/${res.data.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-2 text-sm"
        >
          <option value="">No template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}{t.isPremium ? " (Premium)" : ""}
            </option>
          ))}
        </select>
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create CV
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive" className="w-full max-w-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
