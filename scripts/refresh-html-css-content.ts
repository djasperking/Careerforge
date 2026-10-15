/**
 * Pushes the latest lesson Markdown into the already-seeded HTML & CSS course
 * without touching enrolments or progress. Matches lessons by title.
 *
 * Usage:  node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/refresh-html-css-content.ts
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";

const DIR = path.join(process.cwd(), "scripts", "course-content", "html-css");
const seed = fs.readFileSync(path.join(process.cwd(), "scripts", "seed-html-css-course.ts"), "utf8");
const pairs = [...seed.matchAll(/title:\s*"([^"]+)",\s*type:\s*"(?:TEXT|ASSIGNMENT)"[^}]*?file:\s*"([^"]+)"/g)];

async function main() {
  const course = await db.course.findFirst({ where: { title: { startsWith: "HTML & CSS from Zero" } } });
  if (!course) throw new Error("Course not found");
  // Module 4 became "Final Exam: Build a Website": rename, reorder, and retire the multiple-choice exam.
  const RENAMES: [string, string, number][] = [
    ["🧰 HTML & CSS cheat sheet", "🧰 HTML & CSS cheat sheet", 1],
    ["🚀 Final project: your personal landing page", "🏁 FINAL EXAM: Build your own website", 2],
    ["🎓 Your final exam & what's next", "🎓 You did it! Certificate & what's next", 3],
  ];
  const lessonsToMove = await db.lesson.findMany({ where: { module: { courseId: course.id, title: { in: ["Final Project & Exam", "Final Exam: Build a Website"] } } }, select: { id: true } });
  for (const l of lessonsToMove) await db.lesson.update({ where: { id: l.id }, data: { position: 100 + Math.floor(Math.random() * 1_000_000) } });
  for (const [from, to, position] of RENAMES) {
    await db.lesson.updateMany({ where: { title: from, module: { courseId: course.id } }, data: { title: to, position } });
  }
  await db.courseModule.updateMany({ where: { courseId: course.id, title: "Final Project & Exam" }, data: { title: "Final Exam: Build a Website" } });
  await db.exam.updateMany({ where: { courseId: course.id }, data: { status: "DRAFT" } });
  await db.course.update({
    where: { id: course.id },
    data: {
      description:
        "Go from zero to your first real website. Learn HTML and CSS step by step with fun, interactive lessons — edit live code right inside every lesson — then test yourself with quizzes, write code in the built-in editor with a live preview, build a complete website as your final exam, and earn your certificate. No experience needed.",
    },
  });
  let n = 0;
  for (const [, title, file] of pairs) {
    const content = fs.readFileSync(path.join(DIR, file), "utf8").replace(/\r\n/g, "\n").trim();
    const finalTitle = RENAMES.find((r) => r[0] === title)?.[1] ?? title;
    const res = await db.lesson.updateMany({ where: { title: finalTitle, module: { courseId: course.id } }, data: { content } });
    console.log(res.count ? "updated" : "MISSING", title);
    n += res.count;
  }
  console.log(`${n} lessons refreshed`);
}
main().finally(() => db.$disconnect());
