"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateQuestionsWithAI } from "../actions";

export function AiQuestionGenerator({ examId }: { examId: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER" | "SHORT_ANSWER">("MULTIPLE_CHOICE");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleGenerate() {
    if (topic.trim().length < 2) {
      setMsg({ type: "error", text: "Enter a topic." });
      return;
    }
    setLoading(true);
    setMsg(null);
    const res = await generateQuestionsWithAI(examId, { topic, difficulty, count, type });
    setLoading(false);
    if (!res.ok) setMsg({ type: "error", text: res.error });
    else {
      setMsg({ type: "ok", text: `Generated ${res.data.count} draft question(s) — review them below.` });
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        AI drafts go straight to &quot;Awaiting review&quot; — nothing reaches students until you approve it.
      </p>
      {msg ? <Alert variant={msg.type === "ok" ? "success" : "destructive"}><AlertDescription>{msg.text}</AlertDescription></Alert> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Topic</Label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. ATS optimisation" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
            <option value="MULTIPLE_CHOICE">Multiple choice</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="MULTIPLE_ANSWER">Multiple answer</option>
            <option value="SHORT_ANSWER">Short answer</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Difficulty</Label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">How many</Label>
          <Input type="number" min={1} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-9" />
        </div>
      </div>
      <Button size="sm" onClick={handleGenerate} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate questions
      </Button>
    </div>
  );
}
