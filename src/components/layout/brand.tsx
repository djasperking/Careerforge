import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-display font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Flame className="size-4" />
      </span>
      <span className="text-lg tracking-tight">
        Career<span className="text-primary">Forge</span>
      </span>
    </Link>
  );
}
