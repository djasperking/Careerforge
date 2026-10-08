import { companyHue, companyInitials } from "@/lib/jobs/format";
import { cn } from "@/lib/utils";

/** A neat initials tile in a colour that is stable per company (no logo needed). */
export function CompanyMark({ name, logoUrl, size = "md" }: { name: string; logoUrl?: string | null; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "size-14 text-lg" : "size-11 text-sm";
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={cn("shrink-0 rounded-lg border bg-card object-contain p-1", dims)} />
    );
  }
  const hue = companyHue(name);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-lg font-semibold", dims)}
      style={{ backgroundColor: `hsl(${hue} 60% 50% / 0.14)`, color: `hsl(${hue} 55% 40%)` }}
    >
      {companyInitials(name)}
    </span>
  );
}
