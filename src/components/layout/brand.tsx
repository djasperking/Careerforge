import Link from "next/link";
import { cn } from "@/lib/utils";
import { ForgeMark } from "./forge-mark";

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-display font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <ForgeMark className="size-5" />
      </span>
      <span className="text-lg tracking-tight">
        Career<span className="text-primary">Forge</span>
      </span>
    </Link>
  );
}
