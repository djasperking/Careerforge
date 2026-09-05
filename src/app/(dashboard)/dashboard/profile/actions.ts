"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const profileSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  headline: z.string().max(160).trim().optional().or(z.literal("")),
  bio: z.string().max(2000).trim().optional().or(z.literal("")),
  phone: z.string().max(40).trim().optional().or(z.literal("")),
  location: z.string().max(120).trim().optional().or(z.literal("")),
  skills: z.string().max(1000).optional().or(z.literal("")),
  careerInterests: z.string().max(1000).optional().or(z.literal("")),
  languages: z.string().max(500).optional().or(z.literal("")),
  isPublic: z.union([z.literal("on"), z.literal("")]).optional(),
});

function toList(v?: string) {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function computeCompletion(p: {
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  skills: string[];
  careerInterests: string[];
}) {
  const checks = [
    !!p.headline, !!p.bio, !!p.phone, !!p.location,
    p.skills.length > 0, p.careerInterests.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export type ProfileActionState = { ok?: boolean; error?: string };

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const d = parsed.data;
  const skills = toList(d.skills);
  const careerInterests = toList(d.careerInterests);
  const languages = toList(d.languages);

  const profileData = {
    headline: d.headline || null,
    bio: d.bio || null,
    phone: d.phone || null,
    location: d.location || null,
    skills,
    careerInterests,
    languages,
    isPublic: d.isPublic === "on",
  };

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { name: d.name } }),
    db.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...profileData,
        completionPercent: computeCompletion({ ...profileData, skills, careerInterests }),
      },
      update: {
        ...profileData,
        completionPercent: computeCompletion({ ...profileData, skills, careerInterests }),
      },
    }),
  ]);

  await audit({ actorId: user.id, action: "PROFILE_UPDATED", entity: "Profile", entityId: user.id });
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
