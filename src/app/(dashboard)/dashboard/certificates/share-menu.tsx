"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copy the public verification link, or share it to LinkedIn, WhatsApp or X. */
export function ShareMenu({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `I just earned a certificate: ${title} on Career Forge 🎓`;
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

  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${e(`${text} ${url}`)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
  ];

  return (
    <div className="relative">
      <Button type="button" size="sm" variant="outline" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Share2 className="size-4" /> Share
      </Button>
      {open ? (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-52 rounded-lg border bg-card p-1.5 shadow-lg">
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
