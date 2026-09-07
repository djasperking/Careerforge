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
  const existing = await db.certificate.findFirst({
    where: { userId, courseId, cohortId: null, examAttemptId: null },
  });
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

export type CohortCertificateResult = {
  issued: number;
  skipped: { name: string; reason: string }[];
  rosterSize: number;
};

/**
 * Issue a certificate to each cohort roster member. Idempotent per
 * (userId, cohortId). When the cohort sets `minAttendancePercent` and has
 * sessions, learners below that share of present-marks are skipped.
 */
export async function issueCohortCertificates(cohortId: string): Promise<CohortCertificateResult> {
  const cohort = await db.cohort.findUniqueOrThrow({
    where: { id: cohortId },
    include: { course: { include: { instructor: true } }, sessions: { select: { id: true } } },
  });

  const roster = await db.cohortEnrollment.findMany({
    where: { cohortId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const totalSessions = cohort.sessions.length;
  const gateOn = cohort.minAttendancePercent > 0 && totalSessions > 0;
  const attendedByUser = new Map<string, number>();
  if (gateOn) {
    const rows = await db.sessionAttendance.groupBy({
      by: ["userId"],
      where: { session: { cohortId }, present: true },
      _count: { userId: true },
    });
    for (const r of rows) attendedByUser.set(r.userId, r._count.userId);
  }

  const title = `${cohort.course.title} — ${cohort.title}`;
  const signatureName = cohort.course.instructor?.name ?? "Career Forge";
  let issued = 0;
  const skipped: { name: string; reason: string }[] = [];

  for (const r of roster) {
    const name = r.user.name ?? r.user.email;
    const has = await db.certificate.findFirst({ where: { userId: r.user.id, cohortId } });
    if (has) continue;

    if (gateOn) {
      const pct = Math.round(((attendedByUser.get(r.user.id) ?? 0) / totalSessions) * 100);
      if (pct < cohort.minAttendancePercent) {
        skipped.push({ name, reason: `attended ${pct}% (needs ${cohort.minAttendancePercent}%)` });
        continue;
      }
    }

    const certificate = await db.certificate.create({
      data: {
        publicId: await uniquePublicId(),
        userId: r.user.id,
        courseId: cohort.courseId,
        cohortId,
        studentName: name,
        title,
        completionDate: cohort.endDate,
        issuerName: "Career Forge",
        signatureName,
      },
    });
    await db.notification
      .create({
        data: {
          userId: r.user.id,
          type: "CERTIFICATE",
          title: "Certificate issued",
          body: `Your certificate for "${cohort.title}" is ready.`,
          linkUrl: "/dashboard/certificates",
        },
      })
      .catch(() => {});
    await sendEmail({
      to: r.user.email,
      template: "certificate-issued",
      subject: "Your Career Forge certificate is ready",
      data: { name: r.user.name, courseTitle: title, certificateId: certificate.publicId },
    }).catch(() => {});
    issued += 1;
  }

  await db.cohort.update({ where: { id: cohortId }, data: { certificatesIssuedAt: new Date() } });
  return { issued, skipped, rosterSize: roster.length };
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
