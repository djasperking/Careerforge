"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SharePanel({
  url,
  intro = "Share this link anywhere.",
  shareText,
}: {
  url: string;
  intro?: string;
  shareText?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const encoded = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText ? `${shareText} ${url}` : url);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div className="flex gap-2">
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        <Button type="button" size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Share on LinkedIn ↗
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Share on X ↗
        </a>
        <a
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Share on WhatsApp ↗
        </a>
      </div>
    </div>
  );
}
