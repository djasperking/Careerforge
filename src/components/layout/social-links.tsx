import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import type { SocialLinks as Links } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICONS = [
  { key: "facebook", Icon: Facebook, label: "Facebook" },
  { key: "instagram", Icon: Instagram, label: "Instagram" },
  { key: "twitter", Icon: Twitter, label: "X (Twitter)" },
  { key: "linkedin", Icon: Linkedin, label: "LinkedIn" },
] as const;

export function SocialLinks({
  links,
  className = "",
  onDark = false,
}: {
  links: Links;
  className?: string;
  onDark?: boolean;
}) {
  const items = ICONS.filter(({ key }) => links[key]);
  if (items.length === 0) return null;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {items.map(({ key, Icon, label }) => (
        <a
          key={key}
          href={links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            "grid size-8 place-items-center rounded-lg border transition-colors",
            onDark
              ? "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}
