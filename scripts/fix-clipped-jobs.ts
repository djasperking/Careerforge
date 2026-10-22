/**
 * Tidies the descriptions (and menu-word titles) of jobs the browser extension already clipped.
 * Usage: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fix-clipped-jobs.ts [--apply]
 * Without --apply it only prints what would change.
 */
import { db } from "../src/lib/db";
import { firstContentLine, isChromeWord, structureJobDescription } from "../src/lib/jobs/ingest/clean";
import { uniqueJobSlug } from "../src/lib/jobs/service";

const EXCERPT = /\n*This is an excerpt\. See the full role and apply on [^\n]+\s*$/;

async function main() {
  const apply = process.argv.includes("--apply");
  const jobs = await db.jobPost.findMany({ where: { origin: "CLIP" } });
  console.log(`${jobs.length} clipped jobs`);

  for (const job of jobs) {
    const tail = job.description.match(EXCERPT)?.[0].trim() ?? "";
    const raw = job.description.replace(EXCERPT, "");

    let title = job.title;
    if (isChromeWord(title)) title = firstContentLine(raw) || title;
    let company = job.company;
    if (isChromeWord(company)) company = job.sourceName || company;

    const body = structureJobDescription(raw, {
      title,
      company,
      location: job.location ?? "",
      salaryText: job.salaryText ?? "",
    });
    const description = `${body || `${title} at ${company}.`}${tail ? `\n\n${tail}` : ""}`;

    const changed = description !== job.description || title !== job.title || company !== job.company;
    console.log(`${changed ? "FIX " : "ok  "} [${job.status}] ${job.title} / ${job.company}${title !== job.title ? `  ->  ${title} / ${company}` : ""}`);
    if (!changed || !apply) continue;

    // A published job keeps its link, so shared URLs keep working; a draft can take the better slug.
    const slug = title !== job.title && job.status !== "PUBLISHED" ? await uniqueJobSlug(title, company) : job.slug;
    await db.jobPost.update({ where: { id: job.id }, data: { title, company, description, slug } });
  }
  console.log(apply ? "Applied." : "Dry run. Re-run with --apply to save.");
  await db.$disconnect();
}
main();
