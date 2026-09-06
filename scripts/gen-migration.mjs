// Throwaway migration generator: spins up an embedded Postgres on a temp port,
// runs `prisma migrate dev --name <arg>` against it, then stops. The generated
// migration file lands in prisma/migrations for review + commit.
//
//   node scripts/gen-migration.mjs add_something
import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const name = process.argv[2];
if (!name) {
  console.error("Usage: node scripts/gen-migration.mjs <migration_name>");
  process.exit(1);
}

const DATA_DIR = mkdtempSync(path.join(tmpdir(), "cf-migrate-"));
const PORT = 5544;
const DB = "cf_migrate";
const DATABASE_URL = `postgresql://postgres:postgres@localhost:${PORT}/${DB}?schema=public`;

const pg = new EmbeddedPostgres({ databaseDir: DATA_DIR, user: "postgres", password: "postgres", port: PORT, persistent: false });
await pg.initialise();
await pg.start();
await pg.createDatabase(DB);

try {
  execSync(`npx prisma migrate dev --name ${name} --skip-generate`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL },
  });
} finally {
  try { await pg.stop(); } catch {}
  try { rmSync(DATA_DIR, { recursive: true, force: true }); } catch {}
}
