"use client";

import { useState } from "react";
import { MessageCircle, Mic, FileText, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AiChat } from "./ai-chat";
import { CoverLetterTool } from "./cover-letter-tool";
import { CourseRecommendations } from "./course-recommendations";

const TABS = [
  { key: "career", label: "Career assistant", icon: MessageCircle },
  { key: "interview", label: "Interview coach", icon: Mic },
  { key: "cover-letter", label: "Cover letter", icon: FileText },
  { key: "recommendations", label: "Course recommendations", icon: Compass },
] as const;

export function AiToolsTabs({ cvs }: { cvs: { id: string; title: string }[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("career");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          {tab === "career" ? <AiChat mode="career.assistant" /> : null}
          {tab === "interview" ? <AiChat mode="interview.coach" /> : null}
          {tab === "cover-letter" ? <CoverLetterTool cvs={cvs} /> : null}
          {tab === "recommendations" ? <CourseRecommendations /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
