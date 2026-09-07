"use server";

import { revalidatePath } from "next/cache";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { joinFreeCohort, joinWaitlist } from "@/lib/cohort/service";

type Result = { ok: true } | { ok: false; error: string };

function fail(err: unknown): Result {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function joinCohortWaitlist(cohortId: string, slug: string): Promise<Result> {
  try {
    const user = await requireUserApi();
    await joinWaitlist(cohortId, user.id);
    await audit({ actorId: user.id, action: "COHORT_WAITLISTED", entity: "Cohort", entityId: cohortId });
    revalidatePath(`/courses/${slug}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/** Join a cohort without payment — the caller already owns the course, or it's free. */
export async function joinCohortFree(cohortId: string, slug: string): Promise<Result> {
  try {
    const user = await requireUserApi();
    await joinFreeCohort(cohortId, user.id);
    await audit({ actorId: user.id, action: "COHORT_JOINED", entity: "Cohort", entityId: cohortId });
    revalidatePath(`/courses/${slug}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
