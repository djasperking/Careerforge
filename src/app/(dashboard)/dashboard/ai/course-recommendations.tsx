"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { getCourseRecommendations } from "./actions";

export function CourseRecommendations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{ courseId: string; title: string; slug: string; reason: string }[] | null>(null);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    const res = await getCourseRecommendations();
    setLoading(false);
    if (!res.ok) setError(res.error);
    else setItems(res.data);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Suggestions are based on your profile&apos;s skills and career interests — set those on your{" "}
        <Link href="/dashboard/profile" className="text-primary hover:underline">profile</Link> for better results.
      </p>
      <Button onClick={handleFetch} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Get recommendations
      </Button>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {items && items.length === 0 ? <p className="text-sm text-muted-foreground">No new courses to suggest right now.</p> : null}
      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((i) => (
            <Card key={i.courseId}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{i.title}</p>
                  <p className="text-sm text-muted-foreground">{i.reason}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/courses/${i.slug}`}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
