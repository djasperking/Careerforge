"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download, Copy, Trash2, Save, Loader2, ArrowLeft, ChevronRight, Lock,
  Maximize2, X, FileText, CreditCard,
} from "lucide-react";
import {
  CV_SECTIONS, SECTION_LABELS, parseTemplateConfig, type CVContent,
} from "@/lib/cv/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CvPreview } from "@/components/cv/cv-preview";
import { LabeledTextarea, TagListEditor } from "@/components/cv/field-inputs";
import {
  PersonalInfoEditor, ExperienceEditor, EducationEditor, CertificationsEditor,
  ProjectsEditor, LanguagesEditor, VolunteerEditor, ReferencesEditor,
} from "@/components/cv/section-editors";
import { deleteCv, duplicateCv, saveCv } from "../actions";
import { startCvUnlockCheckout } from "../../payments/actions";
import { cn } from "@/lib/utils";

const PREVIEW_SCALE = 0.52;

interface TemplateOption {
  id: string;
  key: string;
  name: string;
  isPremium: boolean;
  config: unknown;
}

export function CvEditor({
  cvId, initialTitle, initialTemplateId, initialContent, templates,
  cleanExport = false, unlockPriceLabel,
}: {
  cvId: string;
  initialTitle: string;
  initialTemplateId: string | null;
  initialContent: CVContent;
  templates: TemplateOption[];
  cleanExport?: boolean;
  unlockPriceLabel: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId);
  const [content, setContent] = useState<CVContent>(initialContent);
  const [section, setSection] = useState<(typeof CV_SECTIONS)[number]>("personalInfo");

  const [saving, startSave] = useTransition();
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState<"duplicate" | "delete" | null>(null);

  const [unlocking, setUnlocking] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMenu, setDownloadMenu] = useState(false);
  const [pageEstimate, setPageEstimate] = useState(1);
  const previewMeasureRef = useRef<HTMLDivElement>(null);

  const lengthTarget = (content.lengthTarget ?? 0) as 0 | 1 | 2;

  const activeTemplate = templates.find((t) => t.id === templateId) ?? null;
  const templateConfig = useMemo(() => parseTemplateConfig(activeTemplate?.config), [activeTemplate]);

  function update<K extends keyof CVContent>(key: K, value: CVContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  const measurePreview = useCallback(() => {
    const el = previewMeasureRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height / PREVIEW_SCALE;
    setPageEstimate(Math.max(1, Math.ceil((h - 24) / 1123)));
  }, []);

  useEffect(() => {
    measurePreview();
    const el = previewMeasureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measurePreview);
    ro.observe(el);
    return () => ro.disconnect();
  }, [content, templateConfig, measurePreview]);

  function handleSave(reason?: string) {
    setSaveMsg(null);
    startSave(async () => {
      const res = await saveCv({ cvId, title, templateId, content, reason });
      if (!res.ok) setSaveMsg({ type: "error", text: res.error });
      else {
        setSaveMsg({ type: "ok", text: `Saved (v${res.data.version}).` });
        router.refresh();
      }
    });
  }

  async function handleDuplicate() {
    setBusyAction("duplicate");
    const res = await duplicateCv(cvId);
    setBusyAction(null);
    if (res.ok) router.push(`/dashboard/cvs/${res.data.id}`);
  }

  async function handleDelete() {
    setBusyAction("delete");
    const res = await deleteCv(cvId);
    setBusyAction(null);
    if (res.ok) router.push("/dashboard/cvs");
    else {
      setConfirmDelete(false);
      setSaveMsg({ type: "error", text: res.error });
    }
  }

  async function handleUnlock() {
    setUnlocking(true);
    const res = await startCvUnlockCheckout(cvId);
    if (res.ok) {
      window.location.href = res.data.authorizationUrl;
    } else {
      setUnlocking(false);
      setSaveMsg({ type: "error", text: res.error });
    }
  }

  async function handleDownload() {
    setDownloadMenu(false);
    setDownloading(true);
    setSaveMsg(null);
    try {
      // Persist first so the export reflects the latest edits + length target.
      await saveCv({ cvId, title, templateId, content, reason: "pre-download save" });
      const res = await fetch(`/api/cv/${cvId}/pdf`);
      if (res.status === 402) {
        setDownloadMenu(true);
        return;
      }
      if (!res.ok) {
        setSaveMsg({ type: "error", text: "Couldn't build the PDF just now. Please try again." });
        return;
      }
      let trimmed: string[] = [];
      try {
        trimmed = JSON.parse(decodeURIComponent(res.headers.get("X-CV-Trimmed") || "[]"));
      } catch {
        trimmed = [];
      }
      const pages = res.headers.get("X-CV-Pages") ?? "?";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "cv").replace(/[^\w.-]+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (trimmed.length) {
        setSaveMsg({
          type: "ok",
          text: `Downloaded as ${pages} page${pages === "1" ? "" : "s"}. To fit, the PDF ${trimmed.join(", ")} — your saved CV is untouched.`,
        });
      } else {
        setSaveMsg({ type: "ok", text: `Downloaded (${pages} page${pages === "1" ? "" : "s"}).` });
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/cvs"><ArrowLeft className="size-4" /></Link>
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 w-56 font-display text-base font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={templateId ?? ""}
            onChange={(e) => setTemplateId(e.target.value || null)}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.isPremium ? " (Premium)" : ""}
              </option>
            ))}
          </select>
          <select
            value={lengthTarget}
            onChange={(e) => update("lengthTarget", Number(e.target.value) as 0 | 1 | 2)}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm"
            title="Maximum length of the downloaded PDF"
          >
            <option value={0}>Length: fits content</option>
            <option value={1}>Length: 1 page</option>
            <option value={2}>Length: 2 pages</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={busyAction === "duplicate"}>
            <Copy className="size-4" /> Duplicate
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (cleanExport ? handleDownload() : setDownloadMenu((v) => !v))}
              disabled={downloading || unlocking}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : cleanExport ? (
                <Download className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
              Download PDF
            </Button>
            {!cleanExport && downloadMenu ? (
              <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border bg-card p-1.5 shadow-lg">
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Free CVs preview with a watermark. To download a clean PDF:
                </p>
                <Link
                  href="/dashboard/payments"
                  className="flex items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium">Subscribe</span>
                    <span className="block text-xs text-muted-foreground">Every CV downloads clean, no watermark.</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  {unlocking ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" /> : <FileText className="mt-0.5 size-4 shrink-0 text-primary" />}
                  <span>
                    <span className="font-medium">Download just this one — {unlockPriceLabel}</span>
                    <span className="block text-xs text-muted-foreground">One-time payment, no subscription.</span>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} disabled={busyAction === "delete"} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" /> Delete
          </Button>
          <Button size="sm" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          </Button>
        </div>
      </div>

      {saveMsg ? (
        <Alert variant={saveMsg.type === "ok" ? "success" : "destructive"} className="mb-4">
          <AlertDescription>{saveMsg.text}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[190px_1fr_440px]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {CV_SECTIONS.map((key) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={cn(
                "flex shrink-0 items-center justify-between gap-1 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                section === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {SECTION_LABELS[key]}
              <ChevronRight className="hidden size-3.5 lg:block" />
            </button>
          ))}
        </nav>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">{SECTION_LABELS[section]}</h2>
            <SectionForm section={section} content={content} update={update} />
          </CardContent>
        </Card>

        <div className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview · A4</p>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Maximize2 className="size-3.5" /> Enlarge
              </Button>
            </div>
            <div
              className={cn(
                "mb-3 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                lengthTarget !== 0 && pageEstimate > lengthTarget
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <FileText className="size-3.5 shrink-0" />
              <span>
                ≈ {pageEstimate} page{pageEstimate === 1 ? "" : "s"}
                {lengthTarget !== 0
                  ? pageEstimate > lengthTarget
                    ? ` — over your ${lengthTarget}-page target. The PDF will be condensed to fit.`
                    : ` — within your ${lengthTarget}-page target.`
                  : ""}
              </span>
            </div>
            {!cleanExport ? (
              <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium">Unlock to download — {unlockPriceLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  One-time payment for this CV. Removes the watermark and enables the PDF download. No subscription.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={handleUnlock} disabled={unlocking}>
                    {unlocking ? <Loader2 className="size-4 animate-spin" /> : null}
                    Pay {unlockPriceLabel}
                  </Button>
                  <Link href="/dashboard/payments" className="text-xs font-medium text-primary hover:underline">
                    or subscribe for all CVs
                  </Link>
                </div>
              </div>
            ) : null}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setPreviewOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPreviewOpen(true);
                }
              }}
              title="Click to enlarge"
              className={cn(
                "group relative cursor-zoom-in overflow-hidden rounded-lg outline-none transition",
                "ring-2 ring-primary/40 ring-offset-2 ring-offset-muted/40",
                "shadow-[0_0_18px_-2px_hsl(var(--cf-primary)/0.45)]",
                "hover:ring-primary hover:shadow-[0_0_28px_0_hsl(var(--cf-primary)/0.6)]",
                "focus-visible:ring-primary",
              )}
            >
              <div style={{ zoom: PREVIEW_SCALE }}>
                <div ref={previewMeasureRef} className="relative">
                  <CvPreview content={content} template={templateConfig} watermark={!cleanExport} />
                  {Array.from({ length: Math.max(0, pageEstimate - 1) }).map((_, i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-primary/50"
                      style={{ top: (i + 1) * 1123 }}
                    >
                      <span className="absolute right-0 -translate-y-full rounded-t bg-primary/70 px-2 py-0.5 text-[11px] font-medium text-white">
                        Page {i + 2}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent py-2 text-xs font-medium text-white opacity-90 transition group-hover:opacity-100">
                <Maximize2 className="size-3.5" /> Click to enlarge
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Maximize2 className="size-3.5" /> Preview CV
        </Button>
      </div>

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => busyAction !== "delete" && setConfirmDelete(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-cv-title"
            className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <h2 id="delete-cv-title" className="font-display text-lg font-semibold">Delete this CV?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;{title || "Untitled CV"}&rdquo; will be permanently removed. This can&apos;t be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={busyAction === "delete"}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={busyAction === "delete"}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busyAction === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete CV
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="mx-auto flex w-full max-w-[900px] items-center justify-between py-2 text-white">
            <p className="text-sm font-medium">Live preview — {title || "Untitled CV"}</p>
            <div className="flex items-center gap-2">
              {cleanExport ? (
                <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Download PDF
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/dashboard/payments"><CreditCard className="size-4" /> Subscribe</Link>
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleUnlock} disabled={unlocking}>
                    {unlocking ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                    Download — {unlockPriceLabel}
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setPreviewOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
          </div>
          <div
            className="mx-auto w-full max-w-[900px] flex-1 overflow-auto rounded-lg bg-neutral-200 p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-fit">
              <CvPreview content={content} template={templateConfig} watermark={!cleanExport} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionForm({
  section, content, update,
}: {
  section: (typeof CV_SECTIONS)[number];
  content: CVContent;
  update: <K extends keyof CVContent>(key: K, value: CVContent[K]) => void;
}) {
  switch (section) {
    case "personalInfo":
      return <PersonalInfoEditor value={content.personalInfo} onChange={(v) => update("personalInfo", v)} />;
    case "professionalSummary":
      return (
        <LabeledTextarea
          label="Professional summary"
          value={content.professionalSummary}
          onChange={(v) => update("professionalSummary", v)}
          rows={6}
          placeholder="2-4 sentences summarising your experience and strengths."
        />
      );
    case "careerObjective":
      return (
        <LabeledTextarea
          label="Career objective"
          value={content.careerObjective}
          onChange={(v) => update("careerObjective", v)}
          rows={4}
        />
      );
    case "experience":
      return <ExperienceEditor value={content.experience} onChange={(v) => update("experience", v)} />;
    case "education":
      return <EducationEditor value={content.education} onChange={(v) => update("education", v)} />;
    case "skills":
      return <TagListEditor label="Skills" values={content.skills} onChange={(v) => update("skills", v)} placeholder="Add a skill…" />;
    case "certifications":
      return <CertificationsEditor value={content.certifications} onChange={(v) => update("certifications", v)} />;
    case "projects":
      return <ProjectsEditor value={content.projects} onChange={(v) => update("projects", v)} />;
    case "achievements":
      return (
        <TagListEditor
          label="Achievements"
          values={content.achievements}
          onChange={(v) => update("achievements", v)}
          placeholder="Add an achievement…"
        />
      );
    case "languages":
      return <LanguagesEditor value={content.languages} onChange={(v) => update("languages", v)} />;
    case "volunteerExperience":
      return <VolunteerEditor value={content.volunteerExperience} onChange={(v) => update("volunteerExperience", v)} />;
    case "references":
      return <ReferencesEditor value={content.references} onChange={(v) => update("references", v)} />;
    case "additionalInformation":
      return (
        <LabeledTextarea
          label="Additional information"
          value={content.additionalInformation}
          onChange={(v) => update("additionalInformation", v)}
          rows={4}
        />
      );
    default:
      return null;
  }
}
