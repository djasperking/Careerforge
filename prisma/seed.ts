/**
 * Development seed data for Career Forge.
 * All content created here is DEMO / DEVELOPMENT data.
 * Admin credentials come from environment variables — never hard-coded.
 *
 *   ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  ROLE_NAMES,
  type PermissionKey,
  type RoleKey,
} from "../src/lib/rbac";

export const db = new PrismaClient();
export const hash = (p: string) => bcrypt.hash(p, 12);

export async function seedRbac() {
  const permissionRows = await Promise.all(
    (Object.keys(PERMISSIONS) as PermissionKey[]).map((key) =>
      db.permission.upsert({
        where: { key },
        update: { description: PERMISSIONS[key] },
        create: { key, description: PERMISSIONS[key] },
      }),
    ),
  );
  const permByKey = new Map(permissionRows.map((p) => [p.key, p.id]));

  for (const roleKey of Object.keys(ROLE_NAMES) as RoleKey[]) {
    const role = await db.role.upsert({
      where: { key: roleKey },
      update: { name: ROLE_NAMES[roleKey] },
      create: { key: roleKey, name: ROLE_NAMES[roleKey], isSystem: true },
    });

    const grant = ROLE_PERMISSIONS[roleKey];
    const keys: PermissionKey[] =
      grant === "*" ? (Object.keys(PERMISSIONS) as PermissionKey[]) : grant;

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({
      data: keys
        .map((k) => permByKey.get(k))
        .filter((id): id is string => !!id)
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log(`  ✓ ${permissionRows.length} permissions, ${Object.keys(ROLE_NAMES).length} roles`);
}

async function seedUsers() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn("  ! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user");
  } else {
    const superAdmin = await db.role.findUniqueOrThrow({ where: { key: ROLES.SUPER_ADMIN } });
    const admin = await db.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: {},
      create: {
        email: adminEmail.toLowerCase(),
        name: "Platform Admin",
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

  const custEmail = process.env.DEMO_CUSTOMER_EMAIL;
  const custPassword = process.env.DEMO_CUSTOMER_PASSWORD;
  if (custEmail && custPassword) {
    const customerRole = await db.role.findUniqueOrThrow({ where: { key: ROLES.CUSTOMER } });
    const customer = await db.user.upsert({
      where: { email: custEmail.toLowerCase() },
      update: {},
      create: {
        email: custEmail.toLowerCase(),
        name: "Demo Customer",
        passwordHash: await hash(custPassword),
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            headline: "Aspiring Product Manager",
            location: "Lagos, Nigeria",
            skills: ["Communication", "Roadmapping", "SQL"],
            careerInterests: ["Product Management", "UX"],
            completionPercent: 60,
          },
        },
      },
    });
    await db.userRole.upsert({
      where: { userId_roleId: { userId: customer.id, roleId: customerRole.id } },
      update: {},
      create: { userId: customer.id, roleId: customerRole.id },
    });
    console.log(`  ✓ demo customer: ${custEmail}`);
  }
}

export async function seedCvTemplates() {
  const DEFAULT_ORDER = [
    "personalInfo", "professionalSummary", "careerObjective", "experience", "education",
    "skills", "projects", "certifications", "achievements", "languages",
    "volunteerExperience", "references", "additionalInformation",
  ];
  const TECH_ORDER = [
    "personalInfo", "professionalSummary", "skills", "projects", "experience",
    "education", "certifications", "achievements", "languages",
    "volunteerExperience", "references", "additionalInformation",
  ];
  const ACADEMIC_ORDER = [
    "personalInfo", "professionalSummary", "careerObjective", "education", "experience",
    "achievements", "projects", "certifications", "skills", "languages",
    "volunteerExperience", "references", "additionalInformation",
  ];

  const templates = [
    ["classic", "Classic", "Timeless single-column layout.", false,
      { columns: 1, font: "Source Serif", spacing: "comfortable", sectionOrder: DEFAULT_ORDER,
        accent: "#404040", headerAlign: "center", headingStyle: "underline", uppercaseHeadings: true }],
    ["professional", "Professional", "Balanced two-column, recruiter-friendly.", false,
      { columns: 2, font: "Inter", spacing: "comfortable", sectionOrder: DEFAULT_ORDER,
        accent: "#1d4ed8", headerAlign: "left", headingStyle: "underline", uppercaseHeadings: true }],
    ["modern", "Modern", "Clean type, subtle accent colour.", false,
      { columns: 1, font: "Inter", spacing: "spacious", sectionOrder: DEFAULT_ORDER,
        accent: "#0f766e", headerAlign: "left", headingStyle: "bar", uppercaseHeadings: false }],
    ["executive", "Executive", "Senior-level emphasis on impact.", true,
      { columns: 1, font: "Source Serif", spacing: "spacious", sectionOrder: DEFAULT_ORDER,
        accent: "#7c2d12", headerAlign: "center", headingStyle: "plain", uppercaseHeadings: true }],
    ["minimal", "Minimal", "Maximum content, minimum decoration. ATS-safe.", false,
      { columns: 1, font: "Inter", spacing: "compact", sectionOrder: DEFAULT_ORDER,
        accent: "#404040", headerAlign: "left", headingStyle: "plain", uppercaseHeadings: true }],
    ["creative", "Creative", "For design and marketing roles.", true,
      { columns: 2, font: "Inter", spacing: "spacious", sectionOrder: DEFAULT_ORDER,
        accent: "#be185d", headerAlign: "left", headingStyle: "bar", uppercaseHeadings: false }],
    ["technical", "Technical", "Projects and stack front and centre.", false,
      { columns: 2, font: "Inter", spacing: "comfortable", sectionOrder: TECH_ORDER,
        accent: "#4338ca", headerAlign: "left", headingStyle: "bar", uppercaseHeadings: true }],
    ["academic", "Academic", "Publications, research and teaching. Education-first.", true,
      { columns: 1, font: "Source Serif", spacing: "spacious", sectionOrder: ACADEMIC_ORDER,
        accent: "#155e75", headerAlign: "center", headingStyle: "bar", uppercaseHeadings: true }],
  ] as const;

  for (const [key, name, description, isPremium, config] of templates) {
    await db.cVTemplate.upsert({
      where: { key },
      update: { name, description, isPremium, config },
      create: {
        key,
        name,
        description,
        isPremium,
        category: isPremium ? "premium" : "standard",
        config,
      },
    });
  }
  console.log(`  ✓ ${templates.length} CV templates`);
}

export async function seedPlans() {
  const plans = [
    {
      key: "FREE",
      name: "Free",
      priceCents: 0,
      billingPeriod: "none",
      position: 0,
      features: ["Basic account", "1 CV", "Limited AI usage", "Access to free courses"],
      limits: { "cv:count": 1, "ai:requestsPerMonth": 15, "cv:premiumTemplates": false },
    },
    {
      key: "CAREER_PLUS",
      name: "Career Plus",
      priceCents: 350_000,
      billingPeriod: "monthly",
      position: 1,
      features: ["5 CVs", "More AI usage", "Premium CV templates", "Advanced CV analysis"],
      limits: { "cv:count": 5, "ai:requestsPerMonth": 100, "cv:premiumTemplates": true },
    },
    {
      key: "CAREER_PRO",
      name: "Career Pro",
      priceCents: 750_000,
      billingPeriod: "monthly",
      position: 2,
      features: ["Unlimited CVs", "Highest AI limits", "Premium courses", "Advanced career analysis"],
      limits: { "cv:count": -1, "ai:requestsPerMonth": 500, "cv:premiumTemplates": true },
    },
  ];
  for (const p of plans) {
    await db.subscriptionPlan.upsert({
      where: { key: p.key },
      update: { ...p, limits: p.limits as never },
      create: { ...p, limits: p.limits as never },
    });
  }
  console.log(`  ✓ ${plans.length} subscription plans`);
}

async function seedCatalog() {
  const category = await db.category.upsert({
    where: { key: "career-skills" },
    update: {},
    create: { key: "career-skills", name: "Career Skills", kind: "course" },
  });

  const instructor = await db.user.findFirst({ where: { email: process.env.ADMIN_EMAIL?.toLowerCase() } });

  const course = await db.course.upsert({
    where: { slug: "cv-writing-fundamentals" },
    update: {},
    create: {
      slug: "cv-writing-fundamentals",
      title: "CV Writing Fundamentals (Demo)",
      description:
        "A short demo course covering how to structure a CV, write impact-led bullet points and pass ATS screening.",
      status: "PUBLISHED",
      reviewStatus: "APPROVED",
      publishedAt: new Date(),
      level: "BEGINNER",
      durationMinutes: 45,
      priceCents: 0,
      categoryId: category.id,
      instructorId: instructor?.id,
      objectives: ["Structure a CV", "Write strong bullet points", "Understand ATS"],
      requirements: ["No prior experience needed"],
      modules: {
        create: [
          {
            title: "Getting started",
            position: 1,
            lessons: {
              create: [
                { title: "Welcome", type: "VIDEO", position: 1, durationSeconds: 120, isPreview: true },
                { title: "Anatomy of a CV", type: "TEXT", position: 2, content: "A CV has a header, summary, experience, education and skills..." },
              ],
            },
          },
          {
            title: "Writing for impact",
            position: 2,
            lessons: {
              create: [
                { title: "Action verbs and metrics", type: "TEXT", position: 1, content: "Lead each bullet with a verb; quantify the result." },
                { title: "Module quiz", type: "QUIZ", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  const exam = await db.exam.upsert({
    where: { id: "demo-exam-cv" },
    update: {},
    create: {
      id: "demo-exam-cv",
      courseId: course.id,
      title: "CV Fundamentals — Final Exam (Demo)",
      description: "Demo exam. 3 questions, 10 minutes.",
      timeLimitMinutes: 10,
      questionCount: 3,
      passingScore: 66,
      maxAttempts: 3,
      status: "PUBLISHED",
      gradingMode: "AUTO",
      questions: {
        create: [
          {
            type: "MULTIPLE_CHOICE",
            prompt: "What should lead each experience bullet point?",
            explanation: "Start with a strong action verb.",
            position: 1,
            options: {
              create: [
                { text: "An action verb", isCorrect: true, position: 1 },
                { text: "Your job title", isCorrect: false, position: 2 },
                { text: "The company name", isCorrect: false, position: 3 },
                { text: "A date", isCorrect: false, position: 4 },
              ],
            },
          },
          {
            type: "TRUE_FALSE",
            prompt: "ATS systems generally handle multi-column layouts and text boxes well.",
            explanation: "False — single-column, simple layouts parse most reliably.",
            position: 2,
            options: {
              create: [
                { text: "True", isCorrect: false, position: 1 },
                { text: "False", isCorrect: true, position: 2 },
              ],
            },
          },
          {
            type: "MULTIPLE_CHOICE",
            prompt: "Which is the strongest achievement statement?",
            explanation: "The one with a concrete, quantified outcome.",
            position: 3,
            options: {
              create: [
                { text: "Responsible for social media", isCorrect: false, position: 1 },
                { text: "Grew Instagram following by 42% in 6 months", isCorrect: true, position: 2 },
                { text: "Did various marketing tasks", isCorrect: false, position: 3 },
                { text: "Helped the marketing team", isCorrect: false, position: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  await db.course.upsert({
    where: { slug: "advanced-interview-mastery" },
    update: {},
    create: {
      slug: "advanced-interview-mastery",
      title: "Advanced Interview Mastery (Demo)",
      description:
        "A paid demo course for exercising checkout: structured interview frameworks, storytelling techniques and salary negotiation.",
      status: "PUBLISHED",
      reviewStatus: "APPROVED",
      publishedAt: new Date(),
      level: "INTERMEDIATE",
      durationMinutes: 90,
      priceCents: 500_000,
      currency: "NGN",
      categoryId: category.id,
      instructorId: instructor?.id,
      objectives: ["Structure answers with STAR", "Negotiate compensation confidently"],
      requirements: ["Completed CV Writing Fundamentals recommended"],
      modules: {
        create: [
          {
            title: "Interview frameworks",
            position: 1,
            lessons: {
              create: [
                { title: "Introduction", type: "VIDEO", position: 1, durationSeconds: 90, isPreview: true },
                { title: "The STAR method", type: "TEXT", position: 2, content: "Situation, Task, Action, Result." },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`  ✓ demo course "${course.title}" + exam "${exam.title}" + 1 paid demo course`);
}

export async function seedSettings() {
  const settings: [string, unknown][] = [
    ["general.siteName", "Career Forge"],
    ["general.contactEmail", process.env.ADMIN_EMAIL ?? "support@careerforge.local"],
    ["general.currency", process.env.DEFAULT_CURRENCY ?? "NGN"],
    ["auth.registrationOpen", true],
    ["auth.requireEmailVerification", true],
    ["ads.enabled", true],
    ["cv.oneTimePriceCents", 100_000],
    ["cv.oneTimeCurrency", process.env.DEFAULT_CURRENCY ?? "NGN"],
    ["payouts.holdDays", 7],
    ["payouts.minimumCents", 500_000],
    ["social.facebook", "https://www.facebook.com/share/1D1M8nqboJ/"],
    ["social.instagram", "https://www.instagram.com/careerforgeng"],
    ["social.twitter", "https://x.com/careerforgeng"],
    ["social.linkedin", ""],
  ];
  for (const [key, value] of settings) {
    await db.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }
  console.log(`  ✓ ${settings.length} system settings`);
}

async function main() {
  console.log("Seeding Career Forge (demo/development data)…");
  await seedRbac();
  await seedUsers();
  await seedCvTemplates();
  await seedPlans();
  await seedCatalog();
  await seedSettings();
  console.log("Done.");
}

// Guarded so other scripts (e.g. seed-production.ts) can import the
// individual seed*/db/hash exports above without also triggering this
// file's own demo-data run.
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
