import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewCourseForm } from "./new-course-form";

export const metadata = { title: "New course" };

export default async function NewInstructorCoursePage() {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") redirect("/instructor");

  const categories = await db.category.findMany({ where: { kind: "course" }, orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Create a course" description="You can refine everything before submitting for review." />
      <Card>
        <CardContent className="p-5">
          <NewCourseForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}
