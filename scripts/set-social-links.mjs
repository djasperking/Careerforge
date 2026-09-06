// One-off: write the public social profile URLs into SystemSetting.
// Usage (PowerShell), pointing at the target database:
//   $env:DATABASE_URL = "<DATABASE_URL_UNPOOLED from .env>"; node scripts/set-social-links.mjs
//
// Pass overrides as KEY=VALUE args, e.g.
//   node scripts/set-social-links.mjs instagram=https://instagram.com/foo
import { PrismaClient } from "@prisma/client";

const DEFAULTS = {
  "social.facebook": "https://www.facebook.com/share/1D1M8nqboJ/",
  "social.instagram": "https://www.instagram.com/careerforgeng",
  "social.twitter": "https://x.com/careerforgeng",
  "social.linkedin": "",
};

for (const arg of process.argv.slice(2)) {
  const [k, ...rest] = arg.split("=");
  const key = `social.${k}`;
  if (key in DEFAULTS) DEFAULTS[key] = rest.join("=");
}

const db = new PrismaClient();
for (const [key, value] of Object.entries(DEFAULTS)) {
  await db.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  console.log(`  ${key} = ${value || "(cleared)"}`);
}
await db.$disconnect();
console.log("Done.");
