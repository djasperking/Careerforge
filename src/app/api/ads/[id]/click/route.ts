import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { recordClick } from "@/lib/ads/service";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ad = await db.advertisement.findUnique({ where: { id } });
  if (!ad) return NextResponse.redirect(new URL("/", _req.url));

  const user = await getCurrentUser();
  await recordClick(ad.id, user?.id ?? null);

  return NextResponse.redirect(ad.destinationUrl);
}
