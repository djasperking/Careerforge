import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { NewExamForm } from "./new-exam-form";

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  await requirePermissionPage("exams:write");
  const { courseId } = await searchParams;
  const courses = await db.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });

  return (
    <div>
      <PageHeader title="New exam" description="Configure the exam, then add questions." />
      <NewExamForm courses={courses} defaultCourseId={courseId ?? ""} />
    </div>
  );
}
