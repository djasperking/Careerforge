/**
 * One-off: remove pre-launch test data from production.
 * Run:  $env:DATABASE_URL = ((Get-Content .env | Select-String '^DATABASE_URL_UNPOOLED=') -replace '^DATABASE_URL_UNPOOLED=','').Trim('"'); node scripts/delete-test-data.mjs
 * Add  --commit  to actually delete (default is a dry run).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const COMMIT = process.argv.includes("--commit");

const TEST_USER_EMAILS = [
  "shaheestanleyy+cfbuyer@gmail.com",
  "shaheestanleyy+cfseller@gmail.com",
  "smtptest.cf.20260906@gmail.com",
  "pdf.tester.cf@gmail.com",
];
// KEEP: shaheestanleyy@gmail.com (real account)

const TEST_PRODUCT_SLUGS = [
  "cv-template-pack-test",
  "handshake-project-hedgehog-ig-entity-tagging",
];

const TEST_COURSE_SLUGS = ["llm"]; // empty draft, 1-letter title

async function main() {
  const users = await db.user.findMany({
    where: { email: { in: TEST_USER_EMAILS } },
    select: { id: true, email: true, name: true },
  });
  const products = await db.digitalProduct.findMany({
    where: { slug: { in: TEST_PRODUCT_SLUGS } },
    select: { id: true, title: true, slug: true },
  });
  const courses = await db.course.findMany({
    where: { slug: { in: TEST_COURSE_SLUGS }, status: "DRAFT" },
    select: { id: true, title: true, slug: true, _count: { select: { enrollments: true } } },
  });

  console.log("Users to delete:", users.map((u) => u.email));
  console.log("Products to delete:", products.map((p) => p.slug));
  console.log(
    "Courses to delete:",
    courses.map((c) => `${c.slug} (${c._count.enrollments} enrolments)`),
  );

  if (!COMMIT) {
    console.log("\nDry run. Re-run with --commit to delete.");
    await db.$disconnect();
    return;
  }

  // Products first (some may be owned by a user we keep).
  const dp = await db.digitalProduct.deleteMany({ where: { id: { in: products.map((p) => p.id) } } });
  const dc = await db.course.deleteMany({ where: { id: { in: courses.map((c) => c.id) } } });
  // Users last — cascades enrolments, transactions, purchases, certs, sessions,
  // and any digital products they still own.
  const du = await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });

  console.log(`\nDeleted: ${du.count} users, ${dp.count} products, ${dc.count} courses.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
