"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCourse } from "./actions";

export function NewCourseControl() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (title.trim().length < 3) {
      setError("Title needs at least 3 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createCourse({
      title,
      description: "Add a description for this course.",
      level: "BEGINNER",
      durationMinutes: 0,
      priceCents: 0,
      currency: "NGN",
    });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/admin/courses/${res.data.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New course title"
          className="w-56"
        />
        <Button onClick={handleCreate} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create course
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
