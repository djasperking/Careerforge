import { db } from "@/lib/db";
import { generateCertificateId } from "@/lib/utils";
import { sendEmail } from "@/lib/email";

async function uniquePublicId() {
  for (let i = 0; i < 10; i++) {
    const id = generateCertificateId();
    if (!(await db.certificate.findUnique({ where: { publicId: id } }))) return id;
  }
  throw new Error("Could not allocate a unique certificate id");
}

/** Idempotent: never issues a second certificate for the same course completion. */
export async function issueCourseCertificate(userId: string, courseId: string) {
  const existing = await db.certificate.findFirst({ where: { userId, courseId } });
  if (existing) return existing;

  const [user, course] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.course.findUniqueOrThrow({ where: { id: courseId }, include: { instructor: true } }),
  ]);

  const certificate = await db.certificate.create({
    data: {
      publicId: await uniquePublicId(),
      userId,
      courseId,
      studentName: user.name ?? user.email,
      title: `${course.title}`,
      completionDate: new Date(),
      issuerName: "Career Forge",
      signatureName: course.instructor?.name ?? "Career Forge",
    },
  });

  await db.notification.create({
    data: {
      userId,
      type: "CERTIFICATE",
      title: "Certificate issued",
      body: `Your certificate for "${course.title}" is ready.`,
      linkUrl: "/dashboard/certificates",
    },
  });
  await sendEmail({
    to: user.email,
    template: "certificate-issued",
    subject: "Your Career Forge certificate is ready",
    data: { name: user.name, courseTitle: course.title, certificateId: certificate.publicId },
  }).catch(() => {});

  return certificate;
}

/** Idempotent: one certificate per passed exam attempt. */
export async function issueExamCertificate(attemptId: string) {
  const existing = await db.certificate.findFirst({ where: { examAttemptId: attemptId } });
  if (existing) return existing;

  const attempt = await db.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { exam: true, user: true },
  });
  if (!attempt.passed) return null;

  const examCourse = attempt.exam.courseId
    ? await db.course.findUnique({ where: { id: attempt.exam.courseId }, include: { instructor: true } })
    : null;

  const certificate = await db.certificate.create({
    data: {
      publicId: await uniquePublicId(),
      userId: attempt.userId,
      examAttemptId: attempt.id,
      courseId: attempt.exam.courseId,
      studentName: attempt.user.name ?? attempt.user.email,
      title: `${attempt.exam.title}`,
      completionDate: attempt.submittedAt ?? new Date(),
      issuerName: "Career Forge",
      signatureName: examCourse?.instructor?.name ?? "Career Forge",
    },
  });

  await db.notification.create({
    data: {
      userId: attempt.userId,
      type: "CERTIFICATE",
      title: "Certificate issued",
      body: `Your certificate for "${attempt.exam.title}" is ready.`,
      linkUrl: "/dashboard/certificates",
    },
  });

  return certificate;
}
