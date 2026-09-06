import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Course / product cover image with a branded gradient fallback when no
 * thumbnail is set. Plain <img> so it works in RSC without next/image config.
 */
export function CourseThumb({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("aspect-video w-full rounded-lg border object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex aspect-video w-full items-center justify-center rounded-lg border bg-gradient-to-br from-primary/15 to-primary/5 text-primary/40",
        className,
      )}
      aria-hidden
    >
      <GraduationCap className="size-8" />
    </div>
  );
}
