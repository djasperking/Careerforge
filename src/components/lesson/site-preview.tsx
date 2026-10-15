"use client";

import { useMemo } from "react";
import { composePreview, parseSubmission } from "@/lib/course/workspace";
import { cn } from "@/lib/utils";

/**
 * Renders a student's website in a locked-down iframe (`sandbox=""`: no scripts,
 * no forms, no same-origin access), so nothing they wrote can touch the site.
 */
export function SitePreview({ html, title = "Website preview", className }: { html: string; title?: string; className?: string }) {
  return <iframe title={title} sandbox="" srcDoc={html} className={cn("h-full w-full bg-white", className)} />;
}

/** Preview of a saved workspace submission; shows nothing for plain-text work. */
export function SubmissionPreview({ text, className }: { text: string; className?: string }) {
  const doc = useMemo(() => {
    const files = parseSubmission(text);
    return files ? composePreview(files) : null;
  }, [text]);
  if (!doc) return null;
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="border-b bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">Their website</div>
      <SitePreview html={doc} className="h-80" />
    </div>
  );
}
