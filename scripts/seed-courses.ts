/**
 * Seeds every course written in scripts/courses/*.md (see scripts/lib/course-md.ts for the format).
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/seed-courses.ts [--only key] [--refresh] [--replace] [--check]
 *
 *   (no flag)  create courses that do not exist yet; existing ones are skipped
 *   --refresh  update lesson text on existing courses (keeps enrolments and progress)
 *   --replace  delete and rebuild a course (only when nobody is enrolled)
 *   --check    parse the files and print a summary; touches nothing
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { parseCourseMarkdown } from "./lib/course-md";
import { refreshCourseContent, seedCourse, thumbnailSvg } from "./lib/course-seed";

const DIR = path.join(process.cwd(), "scripts", "courses");
const THUMBS = path.join(process.cwd(), "public", "course-thumbs");

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).sort();

  for (const f of files) {
    const spec = parseCourseMarkdown(fs.readFileSync(path.join(DIR, f), "utf8"));
    if (only && spec.key !== only) continue;

    const lessons = spec.modules.flatMap((m) => m.lessons);
    const questions = lessons.reduce((n, l) => n + (l.quiz?.questions.length ?? 0), 0);
    if (args.includes("--check")) {
      console.log(`${spec.key}: ${spec.modules.length} modules, ${lessons.length} lessons, ${questions} quiz questions`);
      continue;
    }

    fs.mkdirSync(THUMBS, { recursive: true });
    fs.writeFileSync(path.join(THUMBS, `${spec.key}.svg`), thumbnailSvg(spec.thumb));

    if (args.includes("--refresh")) await refreshCourseContent(spec);
    else await seedCourse(spec, { replace: args.includes("--replace") });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
