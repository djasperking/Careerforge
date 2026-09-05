"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { startExamAttempt } from "../actions";

export function StartExamButton({ examId, label }: { examId: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    const res = await startExamAttempt(examId);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/dashboard/exams/${examId}/attempts/${res.data.attemptId}`);
  }

  return (
    <div>
      <Button size="lg" onClick={handleStart} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {label}
      </Button>
      {error ? (
        <Alert variant="destructive" className="mt-3 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
