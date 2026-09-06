import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import type { SocialLinks as Links } from "@/lib/site";

const ICONS = [
  { key: "facebook", Icon: Facebook, label: "Facebook" },
  { key: "instagram", Icon: Instagram, label: "Instagram" },
  { key: "twitter", Icon: Twitter, label: "X (Twitter)" },
  { key: "linkedin", Icon: Linkedin, label: "LinkedIn" },
] as const;

export function SocialLinks({ links, className = "" }: { links: Links; className?: string }) {
  const items = ICONS.filter(({ key }) => links[key]);
  if (items.length === 0) return null;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {items.map(({ key, Icon, label }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon className="size-5" />
        </a>
      ))}
    </div>
  );
}
