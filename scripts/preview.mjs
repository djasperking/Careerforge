// Local preview runner: spins up a throwaway embedded PostgreSQL, applies the
// schema, seeds demo data, then starts `next dev` — all in one process.
//
//   node scripts/preview.mjs
//
// Nothing here touches a real database or real credentials. The data directory
// (.preview-db) is disposable; delete it to start fresh.
import EmbeddedPostgres from "embedded-postgres";
import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, ".preview-db");
const PORT = 5433;
const DB = "career_forge";
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PORT}/${DB}?schema=public`;

const fresh = process.argv.includes("--fresh");
if (fresh && existsSync(DATA_DIR)) rmSync(DATA_DIR, { recursive: true, force: true });

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
});

let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  try { await pg.stop(); } catch {}
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

const firstRun = !existsSync(DATA_DIR);
console.log(`[preview] ${firstRun ? "initialising" : "reusing"} database in .preview-db …`);
if (firstRun) await pg.initialise();
try {
  await pg.start();
} catch (err) {
  console.error(
    "\n[preview] postgres failed to start — most likely a previous run crashed and left it locked.\n" +
    "  Fix: close any leftover postgres.exe / node.exe holding ports 3000 or 5433, then run again.\n" +
    "  (Windows: `tasklist | findstr postgres` then `taskkill /F /PID <pid>`)\n",
  );
  throw err;
}
try {
  await pg.createDatabase(DB);
} catch {
  /* already exists */
}
console.log(`[preview] postgres up on :${PORT}`);

// Self-contained demo credentials so the seed always creates a login.
// Override by exporting your own before running.
const env = {
  ...process.env,
  DATABASE_URL,
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY ?? "NGN",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@careerforge.local",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin123!",
  DEMO_CUSTOMER_EMAIL: process.env.DEMO_CUSTOMER_EMAIL ?? "customer@careerforge.local",
  DEMO_CUSTOMER_PASSWORD: process.env.DEMO_CUSTOMER_PASSWORD ?? "ChangeMe_User123!",
  // Preview has no real Paystack keys — default to the mock provider so
  // checkout is exercisable end to end. Set PAYMENT_PROVIDER=paystack
  // yourself (with real keys) to test against the real gateway instead.
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER ?? "mock",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "preview-only-insecure-secret-change-me-000",
};

try {
  console.log("[preview] applying schema (prisma db push) …");
  execSync("npx prisma db push --skip-generate --accept-data-loss", { cwd: ROOT, env, stdio: "inherit" });
  console.log("[preview] seeding demo data …");
  execSync("npx tsx prisma/seed.ts", { cwd: ROOT, env, stdio: "inherit" });
} catch (err) {
  console.error("[preview] setup failed:", err.message);
  await shutdown(1);
}

console.log("\n[preview] starting next dev on http://localhost:3000 …\n");
const dev = spawn("npx", ["next", "dev", "-p", "3000"], {
  cwd: ROOT,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
dev.on("exit", (code) => shutdown(code ?? 0));
