import { ForgeMark } from "@/components/layout/forge-mark";

/** "by [logo] Career Forge" for official courses; a plain name for outside instructors. */
export function InstructorTag({ name }: { name?: string | null }) {
  const official = !name || /^career\s?forge$/i.test(name.trim());
  if (!official) return <span>{name}</span>;
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="grid size-4 place-items-center rounded-[4px] bg-primary text-primary-foreground">
        <ForgeMark className="size-3" />
      </span>
      <span className="font-medium">Career Forge</span>
    </span>
  );
}
