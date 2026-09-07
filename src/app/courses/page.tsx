import Link from "next/link";
import { db } from "@/lib/db";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseThumb } from "@/components/ui/course-thumb";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Explore courses" };

export default async function PublicCoursesPage() {
  const [courses, user] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, instructor: true },
      orderBy: { publishedAt: "desc" },
      take: 60,
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="container py-10">
        <h1 className="font-display text-3xl font-semibold">Explore courses</h1>
        <p className="mt-1 text-muted-foreground">Learn the skills that move your career forward.</p>

        {courses.length === 0 ? (
          <EmptyState title="No published courses yet" description="Check back soon." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`}>
                <Card className="h-full overflow-hidden transition-colors hover:border-primary/40">
                  <CourseThumb src={c.thumbnailUrl} alt={c.title} className="rounded-none border-0 border-b" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      {c.category ? <Badge variant="secondary">{c.category.name}</Badge> : <span />}
                      <span className="text-sm font-medium">
                        {c.priceCents === 0 ? "Free" : formatCurrency(c.priceCents, c.currency)}
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-semibold">{c.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {c.level} · {c.instructor?.name ?? "Career Forge"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
