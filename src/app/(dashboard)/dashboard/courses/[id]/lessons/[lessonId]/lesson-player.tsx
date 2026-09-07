"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizRunner, type LearnerQuiz } from "./quiz-runner";
import { AssignmentPanel, type AssignmentData } from "./assignment-panel";

interface Props {
  courseId: string;
  lessonId: string;
  type: "VIDEO" | "TEXT" | "PDF" | "QUIZ" | "ASSIGNMENT" | "EXAM";
  videoUrl: string | null;
  content: string | null;
  initiallyCompleted: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
  quiz?: LearnerQuiz | null;
  quizAttempts?: { scorePercent: number; passed: boolean; at: string }[];
  assignment?: AssignmentData | null;
}

async function postProgress(courseId: string, lessonId: string, body: object) {
  const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok ? ((await res.json()).data as { completed: boolean }) : null;
}

export function LessonPlayer({
  courseId, lessonId, type, videoUrl, content, initiallyCompleted, prevLessonId, nextLessonId,
  quiz, quizAttempts = [], assignment,
}: Props) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [marking, setMarking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Quiz pass / assignment submit complete the lesson server-side, then
  // router.refresh() feeds a fresh prop — mirror it into local state.
  useEffect(() => {
    setCompleted(initiallyCompleted);
  }, [initiallyCompleted]);

  // Heartbeat while a video is playing — the server, not the client, decides
  // how much watch-time to credit (see the progress route).
  useEffect(() => {
    if (type !== "VIDEO" || completed) return;
    const video = videoRef.current;
    if (!video) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => postProgress(courseId, lessonId, { event: "heartbeat" }).then((r) => {
      if (r?.completed) {
        setCompleted(true);
        router.refresh();
      }
    });
    const start = () => { if (!timer) timer = setInterval(tick, 8000); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    video.addEventListener("ended", () => { tick(); stop(); });
    return () => {
      stop();
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
    };
  }, [type, completed, courseId, lessonId, router]);

  async function markComplete() {
    setMarking(true);
    const r = await postProgress(courseId, lessonId, { event: "complete" });
    setMarking(false);
    if (r?.completed) {
      setCompleted(true);
      router.refresh();
    }
  }

  const canMarkManually = type === "TEXT" || type === "PDF";

  return (
    <div>
      {type === "VIDEO" && videoUrl ? (
        <video ref={videoRef} src={videoUrl} controls className="aspect-video w-full rounded-lg bg-black" />
      ) : null}
      {type === "VIDEO" && !videoUrl ? (
        <div className="grid aspect-video place-items-center rounded-lg bg-muted text-sm text-muted-foreground">
          No video uploaded for this lesson yet.
        </div>
      ) : null}

      {type === "TEXT" ? (
        <div className="prose prose-neutral max-w-none whitespace-pre-wrap rounded-lg border bg-card p-6 text-sm leading-relaxed">
          {content || "No content yet."}
        </div>
      ) : null}

      {type === "PDF" ? (
        videoUrl ? (
          <iframe src={videoUrl} className="h-[70vh] w-full rounded-lg border" title="Lesson PDF" />
        ) : (
          <div className="grid h-40 place-items-center rounded-lg bg-muted text-sm text-muted-foreground">
            No PDF uploaded for this lesson yet.
          </div>
        )
      ) : null}

      {type === "QUIZ" ? (
        quiz ? (
          <QuizRunner courseId={courseId} lessonId={lessonId} quiz={quiz} attempts={quizAttempts} />
        ) : (
          <div className="grid h-40 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No quiz has been added to this lesson yet.
          </div>
        )
      ) : null}

      {type === "ASSIGNMENT" && assignment ? (
        <AssignmentPanel courseId={courseId} lessonId={lessonId} data={assignment} />
      ) : null}

      {type === "EXAM" ? (
        <div className="grid h-40 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Take this course&apos;s exam from the Exams tab.
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <Button asChild variant="outline" size="sm" disabled={!prevLessonId}>
          <Link href={prevLessonId ? `/dashboard/courses/${courseId}/lessons/${prevLessonId}` : "#"}>
            <ChevronLeft className="size-4" /> Previous
          </Link>
        </Button>

        {completed ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="size-3.5" /> Completed
          </Badge>
        ) : canMarkManually ? (
          <Button size="sm" onClick={markComplete} disabled={marking}>
            {marking ? <Loader2 className="size-4 animate-spin" /> : null}
            Mark as complete
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {type === "QUIZ"
              ? "Pass the quiz to complete this lesson."
              : type === "ASSIGNMENT"
                ? "Submit the assignment to complete this lesson."
                : type === "EXAM"
                  ? "Complete the course exam separately."
                  : "Watch to the end to complete this lesson."}
          </span>
        )}

        <Button asChild size="sm" disabled={!nextLessonId}>
          <Link href={nextLessonId ? `/dashboard/courses/${courseId}/lessons/${nextLessonId}` : "#"}>
            Next <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
