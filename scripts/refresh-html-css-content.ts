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
  let n = 0;
  for (const [, title, file] of pairs) {
    const content = fs.readFileSync(path.join(DIR, file), "utf8").replace(/\r\n/g, "\n").trim();
    const res = await db.lesson.updateMany({ where: { title, module: { courseId: course.id } }, data: { content } });
    console.log(res.count ? "updated" : "MISSING", title);
    n += res.count;
  }
  console.log(`${n} lessons refreshed`);
}
main().finally(() => db.$disconnect());
