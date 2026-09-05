"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { enrollInCourse } from "@/app/(dashboard)/dashboard/courses/actions";
import { startCourseCheckout } from "@/app/(dashboard)/dashboard/payments/actions";

export function EnrollButton({
  courseId, isLoggedIn, alreadyEnrolled, isFree,
}: {
  courseId: string;
  isLoggedIn: boolean;
  alreadyEnrolled: boolean;
  isFree: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyEnrolled) {
    return (
      <Button asChild size="lg">
        <Link href={`/dashboard/courses/${courseId}`}>Continue learning</Link>
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild size="lg">
        <Link href={`/login?next=/dashboard/courses`}>Log in to enrol</Link>
      </Button>
    );
  }

  async function handleEnroll() {
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
      <Button size="lg" onClick={handleEnroll} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {isFree ? "Enrol for free" : "Enrol"}
      </Button>
      {error ? (
        <Alert variant="destructive" className="mt-3 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
