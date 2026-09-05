"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createExam } from "../actions";

export function NewExamForm({
  courses, defaultCourseId,
}: {
  courses: { id: string; title: string }[];
  defaultCourseId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(10);
  const [passingScore, setPassingScore] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const res = await createExam({
      title, courseId, timeLimitMinutes, questionCount, passingScore,
      maxAttempts: 3, randomizeQuestions: true, randomizeOptions: true,
      gradingMode: "AUTO", revealAnswers: false,
    });
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.push(`/admin/exams/${res.data.id}`);
  }

  return (
    <div className="max-w-lg space-y-4">
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Final Assessment" />
      </div>
      <div className="space-y-1.5">
        <Label>Course</Label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
          <option value="">Standalone (no course)</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Time limit (min)</Label>
          <Input type="number" min={1} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Questions</Label>
          <Input type="number" min={1} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Pass %</Label>
          <Input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={handleCreate} disabled={loading || title.trim().length < 3}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Create exam
      </Button>
    </div>
  );
}
