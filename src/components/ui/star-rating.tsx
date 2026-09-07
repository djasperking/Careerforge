"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star display. `value` can be fractional (e.g. 4.3). */
export function Stars({ value, className, size = 16 }: { value: number; className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-warning/30" style={{ width: size, height: size }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="fill-warning text-warning" style={{ width: size, height: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Interactive 1-5 picker. */
export function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(i <= shown ? "fill-warning text-warning" : "text-muted-foreground/40")}
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}
