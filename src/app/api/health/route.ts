import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return ok({ status: "healthy", time: new Date().toISOString() });
  } catch {
    return fail(503, "DB_UNAVAILABLE", "Database is not reachable");
  }
}
