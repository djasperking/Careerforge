import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  /** When set, the whole card links here. */
  href?: string;
}) {
  const body = (
    <CardContent className="flex items-start justify-between gap-4 p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </span>
      ) : null}
    </CardContent>
  );

  if (href) {
    return (
      <Card className="group transition-colors hover:border-primary/40">
        <Link href={href} className="block">
          <div className="relative">
            {body}
            <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </Link>
      </Card>
    );
  }

  return <Card>{body}</Card>;
}
