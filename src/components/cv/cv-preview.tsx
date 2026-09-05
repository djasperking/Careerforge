import type { CVContent } from "@/lib/cv/schema";
import type { CvTemplateConfig } from "@/lib/cv/schema";
import { cn } from "@/lib/utils";

/**
 * On-screen, print-ready CV preview. Deliberately simple/ATS-safe markup
 * (headings + text, no tables/columns baked into content) so the same
 * sectionOrder-driven layout works for every template config.
 */
/**
 * On-screen CV preview rendered at true A4 proportions (210×297mm ≈ 794×1123px
 * at 96dpi) so what you see matches the exported PDF. The caller scales the
 * whole page down to fit its column. `watermark` tiles a faint brand mark for
 * users on the free plan.
 */
export function CvPreview({
  content,
  template,
  watermark = false,
}: {
  content: CVContent;
  template: CvTemplateConfig;
  watermark?: boolean;
}) {
  const sidebarKeys = new Set(["personalInfo", "skills", "languages", "certifications"]);
  const order = template.sectionOrder.filter((k) => k in RENDERERS);
  const sidebar = template.columns === 2 ? order.filter((k) => sidebarKeys.has(k)) : [];
  const main = template.columns === 2 ? order.filter((k) => !sidebarKeys.has(k)) : order;

  const spacingClass = { compact: "space-y-3", comfortable: "space-y-5", spacious: "space-y-7" }[template.spacing];

  return (
    <div
      className="relative mx-auto flex w-[794px] min-h-[1123px] flex-col overflow-hidden bg-white px-[64px] py-[56px] text-[13px] leading-relaxed text-neutral-900 shadow-lg ring-1 ring-black/5 print:shadow-none print:ring-0"
      style={{ fontFamily: template.font === "Inter" ? "var(--font-sans)" : "Georgia, 'Times New Roman', serif" }}
    >
      <Header content={content} />
      <div className={cn("mt-6", template.columns === 2 ? "grid grid-cols-3 gap-8" : "")}>
        <div className={cn(spacingClass, template.columns === 2 ? "col-span-2" : "")}>
          {main.map((key) => (
            <Section key={key} sectionKey={key} content={content} />
          ))}
        </div>
        {template.columns === 2 ? (
          <div className={cn(spacingClass)}>
            {sidebar.map((key) => (
              <Section key={key} sectionKey={key} content={content} />
            ))}
          </div>
        ) : null}
      </div>
      {watermark ? <PreviewWatermark /> : null}
    </div>
  );
}

function PreviewWatermark() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="170"><text x="130" y="85" fill="#4f46e5" fill-opacity="0.12" font-family="Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" transform="rotate(-30 130 85)">CAREER FORGE</text></svg>`,
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none"
      style={{ backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundRepeat: "repeat" }}
    />
  );
}

function Header({ content }: { content: CVContent }) {
  const p = content.personalInfo;
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join("  ·  ");
  return (
    <header className="border-b pb-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{p.fullName || "Your Name"}</h1>
      {p.headline ? <p className="mt-0.5 text-sm text-neutral-600">{p.headline}</p> : null}
      {contact ? <p className="mt-2 text-xs text-neutral-500">{contact}</p> : null}
    </header>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
      {children}
    </h2>
  );
}

const RENDERERS: Record<string, (c: CVContent) => React.ReactNode> = {
  personalInfo: () => null,
  professionalSummary: (c) =>
    c.professionalSummary ? (
      <section>
        <H2>Professional Summary</H2>
        <p>{c.professionalSummary}</p>
      </section>
    ) : null,
  careerObjective: (c) =>
    c.careerObjective ? (
      <section>
        <H2>Career Objective</H2>
        <p>{c.careerObjective}</p>
      </section>
    ) : null,
  experience: (c) =>
    c.experience.length ? (
      <section>
        <H2>Work Experience</H2>
        <div className="space-y-3">
          {c.experience.map((e) => (
            <div key={e.id}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{e.title || "Role"} {e.company ? `· ${e.company}` : ""}</p>
                <p className="shrink-0 text-xs text-neutral-500">
                  {e.startDate} — {e.current ? "Present" : e.endDate}
                </p>
              </div>
              {e.location ? <p className="text-xs text-neutral-500">{e.location}</p> : null}
              {e.bullets.length ? (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {e.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    ) : null,
  education: (c) =>
    c.education.length ? (
      <section>
        <H2>Education</H2>
        <div className="space-y-2">
          {c.education.map((e) => (
            <div key={e.id}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">{e.degree || "Qualification"} {e.field ? `, ${e.field}` : ""}</p>
                <p className="shrink-0 text-xs text-neutral-500">{e.startDate} — {e.endDate}</p>
              </div>
              <p className="text-xs text-neutral-500">{e.institution}</p>
              {e.description ? <p className="mt-0.5">{e.description}</p> : null}
            </div>
          ))}
        </div>
      </section>
    ) : null,
  skills: (c) =>
    c.skills.length ? (
      <section>
        <H2>Skills</H2>
        <div className="flex flex-wrap gap-1.5">
          {c.skills.map((s) => (
            <span key={s} className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs">{s}</span>
          ))}
        </div>
      </section>
    ) : null,
  certifications: (c) =>
    c.certifications.length ? (
      <section>
        <H2>Certifications</H2>
        <ul className="space-y-1">
          {c.certifications.map((cert) => (
            <li key={cert.id}>
              <p className="font-medium">{cert.name}</p>
              <p className="text-xs text-neutral-500">{[cert.issuer, cert.issueDate].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
  projects: (c) =>
    c.projects.length ? (
      <section>
        <H2>Projects</H2>
        <div className="space-y-2">
          {c.projects.map((p) => (
            <div key={p.id}>
              <p className="font-semibold">{p.name}</p>
              {p.description ? <p>{p.description}</p> : null}
            </div>
          ))}
        </div>
      </section>
    ) : null,
  achievements: (c) =>
    c.achievements.length ? (
      <section>
        <H2>Achievements</H2>
        <ul className="list-disc space-y-0.5 pl-4">
          {c.achievements.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </section>
    ) : null,
  languages: (c) =>
    c.languages.length ? (
      <section>
        <H2>Languages</H2>
        <ul className="space-y-0.5">
          {c.languages.map((l) => (
            <li key={l.id}>{l.name}{l.proficiency ? ` — ${l.proficiency}` : ""}</li>
          ))}
        </ul>
      </section>
    ) : null,
  volunteerExperience: (c) =>
    c.volunteerExperience.length ? (
      <section>
        <H2>Volunteer Experience</H2>
        <div className="space-y-2">
          {c.volunteerExperience.map((v) => (
            <div key={v.id}>
              <p className="font-semibold">{v.role} {v.organization ? `· ${v.organization}` : ""}</p>
              <p className="text-xs text-neutral-500">{v.startDate} — {v.endDate}</p>
              {v.description ? <p>{v.description}</p> : null}
            </div>
          ))}
        </div>
      </section>
    ) : null,
  references: (c) =>
    c.references.length ? (
      <section>
        <H2>References</H2>
        <ul className="space-y-1">
          {c.references.map((r) => (
            <li key={r.id}>
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-neutral-500">{[r.relationship, r.contact].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
  additionalInformation: (c) =>
    c.additionalInformation ? (
      <section>
        <H2>Additional Information</H2>
        <p>{c.additionalInformation}</p>
      </section>
    ) : null,
};

function Section({ sectionKey, content }: { sectionKey: string; content: CVContent }) {
  return <>{RENDERERS[sectionKey]?.(content) ?? null}</>;
}
