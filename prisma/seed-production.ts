/**
 * Production-safe seed: structural/reference data only — roles & permissions,
 * CV templates, subscription plans, system settings, and exactly one real
 * admin account from ADMIN_EMAIL/ADMIN_PASSWORD.
 *
 * Deliberately does NOT create the demo customer or the demo courses/exam
 * that prisma/seed.ts creates for local development — those are marketing/
 * placeholder content and a publicly-documented demo password that must
 * never exist in a real environment.
 *
 * Usage:
 *   DATABASE_URL="<production>" ADMIN_EMAIL="you@co.com" ADMIN_PASSWORD="..." \
 *     npx tsx prisma/seed-production.ts
 */
import { ROLES } from "../src/lib/rbac";
import { db, hash, seedRbac, seedCvTemplates, seedPlans, seedSettings } from "./seed";

async function seedRealAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running the production seed.");
  }

  const superAdmin = await db.role.findUniqueOrThrow({ where: { key: ROLES.SUPER_ADMIN } });
  const admin = await db.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {},
    create: {
      email: adminEmail.toLowerCase(),
      name: "Admin",
      passwordHash: await hash(adminPassword),
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: { create: { headline: "Administrator" } },
    },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdmin.id },
  });
  console.log(`  ✓ admin: ${adminEmail}`);
}

async function main() {
  console.log("Seeding Career Forge (production — structural data + one real admin, no demo content)…");
  await seedRbac();
  await seedRealAdmin();
  await seedCvTemplates();
  await seedPlans();
  await seedSettings();
  console.log("Done. No demo customer or demo courses were created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
