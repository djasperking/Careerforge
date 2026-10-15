"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrollInCourse } from "./actions";
import { startCourseCheckout } from "../payments/actions";

/** One-click enrol from the course list: free courses open straight away, paid ones go to checkout. */
export function QuickEnroll({ courseId, isFree, priceLabel }: { courseId: string; isFree: boolean; priceLabel: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    if (isFree) {
      const res = await enrollInCourse(courseId);
      setLoading(false);
      if (!res.ok) setError(res.error);
      else router.push(`/dashboard/courses/${courseId}`);
    } else {
      const res = await startCourseCheckout(courseId);
      setLoading(false);
      if (!res.ok) setError(res.error);
      else window.location.href = res.data.authorizationUrl;
    }
  }

  return (
    <div>
      <Button size="sm" className="w-full" onClick={go} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {isFree ? "Enrol for free" : `Enrol · ${priceLabel}`}
      </Button>
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
