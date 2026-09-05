"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { gradeAnswerManually } from "../actions";

interface PendingAnswer {
  id: string;
  attemptId: string;
  studentEmail: string;
  prompt: string;
  textAnswer: string | null;
  maxPoints: number;
}

export function GradingQueue({ answers }: { answers: PendingAnswer[] }) {
  if (answers.length === 0) return <p className="text-sm text-muted-foreground">Nothing awaiting manual grading.</p>;
  return (
    <div className="space-y-3">
      {answers.map((a) => (
        <GradeRow key={a.id} answer={a} />
      ))}
    </div>
  );
}

function GradeRow({ answer }: { answer: PendingAnswer }) {
  const router = useRouter();
  const [points, setPoints] = useState(answer.maxPoints);
  const [feedback, setFeedback] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-xs text-muted-foreground">{answer.studentEmail}</p>
        <p className="text-sm font-medium">{answer.prompt}</p>
        <p className="rounded-md bg-muted p-2 text-sm">{answer.textAnswer || <em>No answer submitted.</em>}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={0}
            max={answer.maxPoints}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="h-8 w-24"
          />
          <span className="text-xs text-muted-foreground">/ {answer.maxPoints} pts</span>
          <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback (optional)" className="h-8 flex-1" />
          <Button
            size="sm"
            disabled={pending}
            onClick={() => start(async () => {
              const res = await gradeAnswerManually(answer.id, answer.attemptId, points, feedback);
              if (res.ok) { setDone(true); router.refresh(); }
            })}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Submit grade"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
