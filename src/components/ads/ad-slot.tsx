import { getCurrentUser } from "@/lib/session";
import { pickAdForPlacement, recordImpression, type Placement } from "@/lib/ads/service";
import { cn } from "@/lib/utils";

/**
 * Server-rendered ad slot for one placement. Picks the highest-priority
 * eligible ad, records an impression, and renders nothing if none qualifies
 * (globally disabled, no active ads, or caps reached) — never a broken box.
 */
export async function AdSlot({ placement, path, className }: { placement: Placement; path: string; className?: string }) {
  const ad = await pickAdForPlacement(placement);
  if (!ad) return null;

  const user = await getCurrentUser();
  await recordImpression(ad.id, user?.id ?? null, path);

  return (
    <a
      href={`/api/ads/${ad.id}/click`}
      className={cn("group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md", className)}
    >
      {ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl} alt={ad.title} className="h-32 w-full object-cover" />
      ) : (
        <div className="grid h-32 w-full place-items-center bg-muted text-sm text-muted-foreground">{ad.title}</div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium group-hover:underline">{ad.title}</p>
        {ad.description ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ad.description}</p> : null}
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Sponsored</p>
      </div>
    </a>
  );
}
