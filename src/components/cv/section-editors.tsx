"use client";

import type {
  CertificationItem, EducationItem, ExperienceItem, LanguageItem, ProjectItem,
  ReferenceItem, VolunteerItem,
} from "@/lib/cv/schema";
import { LabeledInput, LabeledTextarea, ItemCard, AddItemButton } from "./field-inputs";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PersonalInfoEditor({
  value, onChange,
}: {
  value: { fullName: string; headline: string; email: string; phone: string; location: string; website: string; linkedin: string };
  onChange: (v: typeof value) => void;
}) {
  const set = (k: keyof typeof value) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LabeledInput label="Full name" value={value.fullName} onChange={set("fullName")} />
      <LabeledInput label="Professional title" value={value.headline} onChange={set("headline")} placeholder="e.g. Product Manager" />
      <LabeledInput label="Email" value={value.email} onChange={set("email")} type="email" />
      <LabeledInput label="Phone" value={value.phone} onChange={set("phone")} />
      <LabeledInput label="Location" value={value.location} onChange={set("location")} />
      <LabeledInput label="Website" value={value.website} onChange={set("website")} placeholder="https://…" />
      <LabeledInput label="LinkedIn" value={value.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/…" />
    </div>
  );
}

export function ExperienceEditor({
  value, onChange,
}: {
  value: ExperienceItem[];
  onChange: (v: ExperienceItem[]) => void;
}) {
  const update = (i: number, patch: Partial<ExperienceItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Job title" value={item.title} onChange={(v) => update(i, { title: v })} />
            <LabeledInput label="Company" value={item.company} onChange={(v) => update(i, { company: v })} />
            <LabeledInput label="Location" value={item.location} onChange={(v) => update(i, { location: v })} />
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Start" value={item.startDate} onChange={(v) => update(i, { startDate: v })} placeholder="Jan 2022" />
              <LabeledInput
                label="End"
                value={item.current ? "" : item.endDate}
                onChange={(v) => update(i, { endDate: v })}
                placeholder={item.current ? "Present" : "Mar 2024"}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={item.current}
              onChange={(e) => update(i, { current: e.target.checked })}
            />
            I currently work here
          </label>
          <LabeledTextarea
            label="Responsibilities & impact"
            value={item.bullets.join("\n")}
            onChange={(v) => update(i, { bullets: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
            rows={4}
            placeholder={"One achievement per line, e.g.\nGrew signups 32% by redesigning onboarding"}
            hint="One line per bullet point."
          />
        </ItemCard>
      ))}
      <AddItemButton
        label="Add experience"
        onClick={() =>
          onChange([
            ...value,
            { id: newId(), company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [] },
          ])
        }
      />
    </div>
  );
}

export function EducationEditor({ value, onChange }: { value: EducationItem[]; onChange: (v: EducationItem[]) => void }) {
  const update = (i: number, patch: Partial<EducationItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Institution" value={item.institution} onChange={(v) => update(i, { institution: v })} />
            <LabeledInput label="Degree" value={item.degree} onChange={(v) => update(i, { degree: v })} />
            <LabeledInput label="Field of study" value={item.field} onChange={(v) => update(i, { field: v })} />
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Start" value={item.startDate} onChange={(v) => update(i, { startDate: v })} />
              <LabeledInput label="End" value={item.endDate} onChange={(v) => update(i, { endDate: v })} />
            </div>
          </div>
          <LabeledTextarea label="Notes" value={item.description} onChange={(v) => update(i, { description: v })} rows={2} />
        </ItemCard>
      ))}
      <AddItemButton
        label="Add education"
        onClick={() => onChange([...value, { id: newId(), institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" }])}
      />
    </div>
  );
}

export function CertificationsEditor({ value, onChange }: { value: CertificationItem[]; onChange: (v: CertificationItem[]) => void }) {
  const update = (i: number, patch: Partial<CertificationItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Name" value={item.name} onChange={(v) => update(i, { name: v })} />
            <LabeledInput label="Issuer" value={item.issuer} onChange={(v) => update(i, { issuer: v })} />
            <LabeledInput label="Issue date" value={item.issueDate} onChange={(v) => update(i, { issueDate: v })} />
            <LabeledInput label="Credential ID" value={item.credentialId} onChange={(v) => update(i, { credentialId: v })} />
          </div>
        </ItemCard>
      ))}
      <AddItemButton
        label="Add certification"
        onClick={() => onChange([...value, { id: newId(), name: "", issuer: "", issueDate: "", credentialId: "" }])}
      />
    </div>
  );
}

export function ProjectsEditor({ value, onChange }: { value: ProjectItem[]; onChange: (v: ProjectItem[]) => void }) {
  const update = (i: number, patch: Partial<ProjectItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Name" value={item.name} onChange={(v) => update(i, { name: v })} />
            <LabeledInput label="URL" value={item.url} onChange={(v) => update(i, { url: v })} />
          </div>
          <LabeledTextarea label="Description" value={item.description} onChange={(v) => update(i, { description: v })} rows={2} />
        </ItemCard>
      ))}
      <AddItemButton label="Add project" onClick={() => onChange([...value, { id: newId(), name: "", description: "", url: "" }])} />
    </div>
  );
}

export function LanguagesEditor({ value, onChange }: { value: LanguageItem[]; onChange: (v: LanguageItem[]) => void }) {
  const update = (i: number, patch: Partial<LanguageItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Language" value={item.name} onChange={(v) => update(i, { name: v })} />
            <LabeledInput label="Proficiency" value={item.proficiency} onChange={(v) => update(i, { proficiency: v })} placeholder="Fluent, Native, B2…" />
          </div>
        </ItemCard>
      ))}
      <AddItemButton label="Add language" onClick={() => onChange([...value, { id: newId(), name: "", proficiency: "" }])} />
    </div>
  );
}

export function VolunteerEditor({ value, onChange }: { value: VolunteerItem[]; onChange: (v: VolunteerItem[]) => void }) {
  const update = (i: number, patch: Partial<VolunteerItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Organization" value={item.organization} onChange={(v) => update(i, { organization: v })} />
            <LabeledInput label="Role" value={item.role} onChange={(v) => update(i, { role: v })} />
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <LabeledInput label="Start" value={item.startDate} onChange={(v) => update(i, { startDate: v })} />
              <LabeledInput label="End" value={item.endDate} onChange={(v) => update(i, { endDate: v })} />
            </div>
          </div>
          <LabeledTextarea label="Description" value={item.description} onChange={(v) => update(i, { description: v })} rows={2} />
        </ItemCard>
      ))}
      <AddItemButton
        label="Add volunteer experience"
        onClick={() => onChange([...value, { id: newId(), organization: "", role: "", startDate: "", endDate: "", description: "" }])}
      />
    </div>
  );
}

export function ReferencesEditor({ value, onChange }: { value: ReferenceItem[]; onChange: (v: ReferenceItem[]) => void }) {
  const update = (i: number, patch: Partial<ReferenceItem>) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div className="space-y-4">
      {value.map((item, i) => (
        <ItemCard key={item.id} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput label="Name" value={item.name} onChange={(v) => update(i, { name: v })} />
            <LabeledInput label="Relationship" value={item.relationship} onChange={(v) => update(i, { relationship: v })} />
            <LabeledInput label="Contact" value={item.contact} onChange={(v) => update(i, { contact: v })} />
          </div>
        </ItemCard>
      ))}
      <AddItemButton label="Add reference" onClick={() => onChange([...value, { id: newId(), name: "", relationship: "", contact: "" }])} />
    </div>
  );
}
