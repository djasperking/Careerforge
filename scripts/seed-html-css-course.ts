/**
 * Creates the "HTML & CSS from Zero" course — modules, lessons, quizzes,
 * assignments and the final exam — taught by the site owner.
 *
 * Usage:  node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/seed-html-css-course.ts [--replace]
 *
 * Re-running is safe: it refuses to touch an existing course unless you pass
 * --replace, and even then only when nobody is enrolled yet.
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { uniqueCourseSlug } from "@/lib/course/service";
import { QUIZ_CSS, QUIZ_HTML, QUIZ_WEB_BASICS, type Q } from "./course-content/html-css-questions";

const OWNER_EMAIL = "danielakpobomej@gmail.com";
const TITLE = "HTML & CSS from Zero: Build Your First Website";
const CONTENT_DIR = path.join(process.cwd(), "scripts", "course-content", "html-css");

type LessonSpec = {
  title: string;
  type: "TEXT" | "QUIZ" | "ASSIGNMENT";
  seconds: number;
  file?: string; // markdown in CONTENT_DIR (text lessons and assignment briefs)
  quiz?: { title: string; questions: Q[] };
  preview?: boolean;
};

const MODULES: { title: string; lessons: LessonSpec[] }[] = [
  {
    title: "Welcome to the Web",
    lessons: [
      { title: "👋 Welcome — what you'll build", type: "TEXT", seconds: 300, file: "01-welcome.md", preview: true },
      { title: "🌍 How websites work: HTML, CSS & the browser", type: "TEXT", seconds: 420, file: "02-how-the-web-works.md", preview: true },
      { title: "🧠 Quick check: how the web works", type: "QUIZ", seconds: 240, quiz: { title: "How the web works", questions: QUIZ_WEB_BASICS } },
    ],
  },
  {
    title: "HTML: The Skeleton",
    lessons: [
      { title: "🏗️ Your first web page", type: "TEXT", seconds: 480, file: "04-first-page.md" },
      { title: "✍️ Headings, paragraphs & text", type: "TEXT", seconds: 420, file: "05-text.md" },
      { title: "🔗 Links & images", type: "TEXT", seconds: 480, file: "06-links-images.md" },
      { title: "📋 Lists & tables", type: "TEXT", seconds: 420, file: "07-lists-tables.md" },
      { title: "📝 Forms: collecting information", type: "TEXT", seconds: 540, file: "08-forms.md" },
      { title: "🧭 Semantic HTML: giving your page meaning", type: "TEXT", seconds: 420, file: "09-semantic-html.md" },
      { title: "🧠 HTML checkpoint", type: "QUIZ", seconds: 360, quiz: { title: "HTML checkpoint", questions: QUIZ_HTML } },
      { title: "🏗️ Assignment 1: Build your About Me page", type: "ASSIGNMENT", seconds: 2400, file: "11-assignment-about-me.md" },
    ],
  },
  {
    title: "CSS: Style & Layout",
    lessons: [
      { title: "🎨 Meet CSS: selectors & properties", type: "TEXT", seconds: 540, file: "12-meet-css.md" },
      { title: "🌈 Colors, fonts & text", type: "TEXT", seconds: 480, file: "13-colors-fonts.md" },
      { title: "📦 The box model", type: "TEXT", seconds: 540, file: "14-box-model.md" },
      { title: "🧩 Flexbox: layout made easy", type: "TEXT", seconds: 600, file: "15-flexbox.md" },
      { title: "📱 Responsive design: one site, every screen", type: "TEXT", seconds: 540, file: "16-responsive.md" },
      { title: "✨ Hover effects & transitions", type: "TEXT", seconds: 480, file: "17-hover-effects.md" },
      { title: "🧠 CSS checkpoint", type: "QUIZ", seconds: 360, quiz: { title: "CSS checkpoint", questions: QUIZ_CSS } },
      { title: "🎨 Assignment 2: Style your About Me page", type: "ASSIGNMENT", seconds: 3000, file: "19-assignment-style-it.md" },
    ],
  },
  {
    title: "Final Exam: Build a Website",
    lessons: [
      { title: "🧰 HTML & CSS cheat sheet", type: "TEXT", seconds: 300, file: "21-cheat-sheet.md" },
      { title: "🏁 FINAL EXAM: Build your own website", type: "ASSIGNMENT", seconds: 5400, file: "20-final-project.md" },
      { title: "🎓 You did it! Certificate & what's next", type: "TEXT", seconds: 240, file: "22-final-exam-next.md" },
    ],
  },
];

const read = (file: string) => fs.readFileSync(path.join(CONTENT_DIR, file), "utf8").replace(/\r\n/g, "\n").trim();

async function main() {
  const replace = process.argv.includes("--replace");

  const owner = await db.user.findUnique({ where: { email: OWNER_EMAIL }, include: { instructorProfile: true } });
  if (!owner) throw new Error(`Owner account ${OWNER_EMAIL} not found.`);

  // "Admin" is the account's placeholder name — a course "by Admin" isn't by you.
  if (!owner.name || owner.name === "Admin") {
    await db.user.update({ where: { id: owner.id }, data: { name: "Daniel Akpobome" } });
    console.log("Set display name: Daniel Akpobome");
  }
  const ip = owner.instructorProfile;
  const placeholderBio = !ip || /text phrase|administrator/i.test(`${ip.bio} ${ip.headline}`);
  if (placeholderBio) {
    const data = {
      status: "APPROVED" as const,
      headline: "Founder & instructor at Career Forge",
      bio: "Daniel builds Career Forge, a platform that helps people in Nigeria and across Africa learn in-demand digital skills, build strong CVs and land remote work. He teaches beginner web development with a focus on learning by doing.",
      expertise: ["Web development", "Career skills", "HTML & CSS"],
    };
    await db.instructorProfile.upsert({ where: { userId: owner.id }, update: data, create: { userId: owner.id, ...data } });
    console.log("Updated instructor profile.");
  }

  // Existing copy?
  const existing = await db.course.findFirst({ where: { title: TITLE } });
  if (existing) {
    const enrolled = await db.enrollment.count({ where: { courseId: existing.id } });
    if (!replace) {
      console.log(`Course already exists (${existing.slug}). Pass --replace to rebuild it (only allowed with zero enrolments).`);
      return;
    }
    if (enrolled > 0) throw new Error(`Refusing to replace: ${enrolled} learner(s) are enrolled.`);
    await db.exam.deleteMany({ where: { courseId: existing.id } });
    await db.course.delete({ where: { id: existing.id } });
    console.log("Removed the previous copy.");
  }

  const category = await db.category.upsert({
    where: { key: "web-development" },
    update: {},
    create: { key: "web-development", name: "Web Development", kind: "course" },
  });

  const totalSeconds = MODULES.flatMap((m) => m.lessons).reduce((n, l) => n + l.seconds, 0);

  const course = await db.course.create({
    data: {
      slug: await uniqueCourseSlug(TITLE),
      title: TITLE,
      description:
        "Go from zero to your first real website. Learn HTML and CSS step by step with fun, interactive lessons — edit live code right inside every lesson — then test yourself with quizzes, write code in the built-in editor with a live preview, build a complete website as your final exam, and earn your certificate. No experience needed.",
      thumbnailUrl: "/course-thumbs/html-css.svg",
      categoryId: category.id,
      instructorId: owner.id,
      level: "BEGINNER",
      durationMinutes: Math.round(totalSeconds / 60),
      priceCents: 0,
      currency: "NGN",
      requirements: [
        "A computer with a web browser (Chrome, Edge, Firefox or Safari)",
        "A free text editor such as VS Code — even Notepad works",
        "No coding experience needed, just curiosity",
      ],
      objectives: [
        "Write clean HTML pages with headings, links, images, lists, tables and forms",
        "Structure pages with semantic tags that Google and screen readers understand",
        "Style pages with CSS: colours, fonts, spacing and the box model",
        "Lay out pages with Flexbox",
        "Make pages responsive so they work on phones and laptops",
        "Add hover effects and smooth transitions",
        "Build and submit a complete personal landing page",
      ],
      status: "PUBLISHED",
      reviewStatus: "APPROVED",
      publishedAt: new Date(),
    },
  });

  let lessonCount = 0;
  let quizQuestions = 0;
  for (const [mi, mod] of MODULES.entries()) {
    const module = await db.courseModule.create({ data: { courseId: course.id, title: mod.title, position: mi + 1 } });
    for (const [li, spec] of mod.lessons.entries()) {
      const lesson = await db.lesson.create({
        data: {
          moduleId: module.id,
          title: spec.title,
          type: spec.type,
          position: li + 1,
          durationSeconds: spec.seconds,
          isPreview: Boolean(spec.preview),
          content: spec.file ? read(spec.file) : null,
        },
      });
      lessonCount++;
      if (spec.quiz) {
        // One nested write = one round trip, so a quiz saves quickly even over a slow link.
        await db.quiz.create({
          data: {
            lessonId: lesson.id,
            title: spec.quiz.title,
            passingScore: 70,
            maxAttempts: 0,
            questions: {
              create: spec.quiz.questions.map((q, qi) => ({
                type: q.type,
                prompt: q.prompt,
                explanation: q.explanation,
                points: q.points,
                position: qi,
                reviewStatus: "APPROVED" as const,
                options: { create: q.options.map((o, oi) => ({ text: o.text, isCorrect: o.isCorrect, position: oi })) },
              })),
            },
          },
        });
        quizQuestions += spec.quiz.questions.length;
      }
    }
  }

  console.log("\n✅ Course created");
  console.log(`   ${course.title}`);
  console.log(`   slug: ${course.slug}  ·  instructor: ${owner.email}  ·  free  ·  published`);
  console.log(`   ${MODULES.length} modules, ${lessonCount} lessons (${quizQuestions} quiz questions, 2 coding assignments + the final website), ~${course.durationMinutes} min`);
  console.log(`   /courses/${course.slug}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await db.$disconnect();
    process.exit(1);
  });
