/**
 * Shared helpers for seeding a course from a plain TypeScript spec: lessons
 * with Markdown content, quizzes, assignments, and a thumbnail.
 */
import { db } from "@/lib/db";
import { uniqueCourseSlug } from "@/lib/course/service";

export const OWNER_EMAIL = "danielakpobomej@gmail.com";

export interface QuizQ {
  prompt: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
}

let rot = 0;
/** One right answer among wrong ones; the right answer's position rotates so it is not always first. */
export function q(prompt: string, correct: string, wrong: string[], explanation: string): QuizQ {
  const options = wrong.map((text) => ({ text, isCorrect: false }));
  options.splice(rot++ % (wrong.length + 1), 0, { text: correct, isCorrect: true });
  return { prompt, explanation, options, type: "MULTIPLE_CHOICE" };
}
export function tf(prompt: string, answer: boolean, explanation: string): QuizQ {
  return {
    prompt,
    explanation,
    type: "TRUE_FALSE",
    options: [
      { text: "True", isCorrect: answer },
      { text: "False", isCorrect: !answer },
    ],
  };
}

export interface LessonSpec {
  title: string;
  type: "TEXT" | "QUIZ" | "ASSIGNMENT";
  seconds: number;
  /** Markdown for TEXT lessons and assignment briefs. */
  content?: string;
  quiz?: { title: string; questions: QuizQ[] };
  preview?: boolean;
}

export interface CourseSpec {
  key: string;
  title: string;
  description: string;
  category: { key: string; name: string };
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  /** Price in naira; 0 or missing means free. */
  priceNaira?: number;
  requirements: string[];
  objectives: string[];
  modules: { title: string; lessons: LessonSpec[] }[];
  /** Used to draw the thumbnail (public/course-thumbs/<key>.svg). */
  thumb: { top: string; headline: string; sub: string; chips: [string, string]; emoji: string; from: string; via: string; to: string };
}

export async function seedCourse(spec: CourseSpec, opts: { replace?: boolean } = {}) {
  const owner = await db.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) throw new Error(`Owner account ${OWNER_EMAIL} not found.`);

  const existing = await db.course.findFirst({ where: { title: spec.title } });
  if (existing) {
    if (!opts.replace) {
      console.log(`- ${spec.key}: already exists (${existing.slug}), skipped.`);
      return existing;
    }
    const enrolled = await db.enrollment.count({ where: { courseId: existing.id } });
    if (enrolled > 0) throw new Error(`Refusing to replace ${spec.key}: ${enrolled} learner(s) are enrolled.`);
    await db.exam.deleteMany({ where: { courseId: existing.id } });
    await db.course.delete({ where: { id: existing.id } });
  }

  const category = await db.category.upsert({
    where: { key: spec.category.key },
    update: {},
    create: { key: spec.category.key, name: spec.category.name, kind: "course" },
  });

  const totalSeconds = spec.modules.flatMap((m) => m.lessons).reduce((n, l) => n + l.seconds, 0);
  const course = await db.course.create({
    data: {
      slug: await uniqueCourseSlug(spec.title),
      title: spec.title,
      description: spec.description,
      thumbnailUrl: `/course-thumbs/${spec.key}.svg`,
      categoryId: category.id,
      instructorId: owner.id,
      level: spec.level,
      durationMinutes: Math.round(totalSeconds / 60),
      priceCents: Math.round((spec.priceNaira ?? 0) * 100),
      currency: "NGN",
      requirements: spec.requirements,
      objectives: spec.objectives,
      status: "PUBLISHED",
      reviewStatus: "APPROVED",
      publishedAt: new Date(),
    },
  });

  const lessons = await createModules(course.id, spec);
  console.log(`✅ ${spec.key}: ${spec.title} — ${spec.modules.length} modules, ${lessons} lessons → /courses/${course.slug}`);
  return course;
}


async function createModules(courseId: string, spec: CourseSpec): Promise<number> {
  let lessons = 0;
  for (const [mi, mod] of spec.modules.entries()) {
    const module = await db.courseModule.create({ data: { courseId: courseId, title: mod.title, position: mi + 1 } });
    for (const [li, l] of mod.lessons.entries()) {
      const lesson = await db.lesson.create({
        data: {
          moduleId: module.id,
          title: l.title,
          type: l.type,
          position: li + 1,
          durationSeconds: l.seconds,
          isPreview: Boolean(l.preview),
          content: l.content?.trim() ?? null,
        },
      });
      lessons++;
      if (l.quiz) {
        await db.quiz.create({
          data: {
            lessonId: lesson.id,
            title: l.quiz.title,
            passingScore: 70,
            maxAttempts: 0,
            questions: {
              create: l.quiz.questions.map((qq, qi) => ({
                type: qq.type,
                prompt: qq.prompt,
                explanation: qq.explanation,
                points: 1,
                position: qi,
                reviewStatus: "APPROVED" as const,
                options: { create: qq.options.map((o, oi) => ({ text: o.text, isCorrect: o.isCorrect, position: oi })) },
              })),
            },
          },
        });
      }
    }
  }
  return lessons;
}

/**
 * Replaces a course's modules, lessons and quizzes with the spec, keeping the course, its link
 * and its enrolments. Learners' lesson progress is reset, because the lessons are new.
 */
export async function rebuildCourse(spec: CourseSpec) {
  const course = await db.course.findFirst({ where: { title: spec.title } });
  if (!course) throw new Error(`${spec.key} not seeded yet.`);
  await db.courseModule.deleteMany({ where: { courseId: course.id } });
  await db.course.update({
    where: { id: course.id },
    data: {
      description: spec.description,
      priceCents: Math.round((spec.priceNaira ?? 0) * 100),
      requirements: spec.requirements,
      objectives: spec.objectives,
      durationMinutes: Math.round(spec.modules.flatMap((m) => m.lessons).reduce((n, l) => n + l.seconds, 0) / 60),
    },
  });
  const lessons = await createModules(course.id, spec);
  await db.enrollment.updateMany({
    where: { courseId: course.id },
    data: { progressPercent: 0, status: "ACTIVE", completedAt: null },
  });
  console.log(`♻️  ${spec.key}: rebuilt with ${spec.modules.length} modules, ${lessons} lessons`);
}

/** Updates lesson content/quizzes in place for an existing course (keeps enrolments and progress). */
export async function refreshCourseContent(spec: CourseSpec) {
  const course = await db.course.findFirst({ where: { title: spec.title } });
  if (!course) throw new Error(`${spec.key} not seeded yet.`);
  await db.course.update({
    where: { id: course.id },
    data: { description: spec.description, priceCents: Math.round((spec.priceNaira ?? 0) * 100), requirements: spec.requirements, objectives: spec.objectives },
  });
  let n = 0;
  for (const mod of spec.modules) {
    for (const l of mod.lessons) {
      if (l.content === undefined) continue;
      const r = await db.lesson.updateMany({ where: { title: l.title, module: { courseId: course.id } }, data: { content: l.content.trim() } });
      n += r.count;
    }
  }
  console.log(`${spec.key}: refreshed ${n} lessons`);
}

/** A bright, on-brand thumbnail for the catalogue (1280×720 SVG). */
export function thumbnailSvg(t: CourseSpec["thumb"], free = true): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="${esc(t.headline)}. ${esc(t.sub)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.from}"/><stop offset="0.5" stop-color="${t.via}"/><stop offset="1" stop-color="${t.to}"/></linearGradient>
    <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="#fff" opacity="0.14"/></pattern>
    <filter id="pop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/><rect width="1280" height="720" fill="url(#dots)"/>
  <circle cx="1180" cy="40" r="210" fill="#fff" opacity="0.08"/><circle cx="40" cy="700" r="250" fill="#000" opacity="0.10"/>
  <g font-family="'Arial Black', Impact, 'Segoe UI', Arial, sans-serif" font-weight="900">
    <text x="64" y="132" font-size="38" fill="#fde68a" letter-spacing="6">${esc(t.top.toUpperCase())}</text>
    <g transform="rotate(-2 270 300)" filter="url(#pop)"><rect x="52" y="160" width="700" height="190" rx="26" fill="#fde047"/>
      <text x="82" y="290" font-size="${t.headline.length > 14 ? 78 : 104}" fill="#3b0764">${esc(t.headline.toUpperCase())}</text></g>
  </g>
  <g font-family="'Segoe UI', Arial, sans-serif" fill="#fff">
    <text x="64" y="470" font-size="40" font-weight="700">${esc(t.sub)}</text>
  </g>
  <g font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="28" text-anchor="middle">
    <rect x="64" y="560" width="230" height="60" rx="30" fill="#fff"/><text x="179" y="600" fill="${t.via}">${esc(t.chips[0])}</text>
    <rect x="314" y="560" width="290" height="60" rx="30" fill="#fff"/><text x="459" y="600" fill="${t.from}">${esc(t.chips[1])}</text>
  </g>
  <g filter="url(#pop)"><circle cx="1000" cy="380" r="190" fill="#fff" opacity="0.95"/><text x="1000" y="450" font-size="190" text-anchor="middle">${t.emoji}</text></g>
  ${free ? `<g filter="url(#pop)" transform="rotate(12 1180 118)"><polygon fill="#fde047" points="1180,30 1203,70 1250,66 1230,108 1262,144 1217,156 1213,204 1176,176 1137,204 1136,156 1094,142 1124,106 1108,64 1154,70"/><text x="1180" y="136" font-family="'Arial Black', Impact, Arial, sans-serif" font-weight="900" font-size="46" fill="${t.via}" text-anchor="middle">FREE</text></g>` : ""}
</svg>
`;
}
