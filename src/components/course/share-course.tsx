"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copy the public course link, or share it straight to WhatsApp, X, Facebook or LinkedIn. */
export function ShareCourse({ url, title, free }: { url: string; title: string; free: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = free ? `Free course: ${title} 🎓` : `Check out this course: ${title} 🎓`;
  const e = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* cancelled — fall back to copying */
      }
    }
    void copy();
  }

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${e(`${text} ${url}`)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
  ];

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Share2 className="size-4" /> Share this course
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
          {copied ? "Link copied" : "Copy link"}
        </Button>
        {links.map((l) => (
          <Button key={l.label} asChild size="sm" variant="outline">
            <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" className="sm:hidden" onClick={nativeShare}>
          More…
        </Button>
      </div>
      <p className="break-all text-xs text-muted-foreground">{url}</p>
    </div>
  );
}
