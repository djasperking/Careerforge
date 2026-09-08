"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download, Copy, Trash2, Save, Sparkles, Loader2, ArrowLeft, ChevronRight, Lock,
  Maximize2, X,
} from "lucide-react";
import {
  CV_SECTIONS, SECTION_LABELS, parseTemplateConfig, type CVContent,
} from "@/lib/cv/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CvPreview } from "@/components/cv/cv-preview";
import { LabeledTextarea, TagListEditor } from "@/components/cv/field-inputs";
import {
  PersonalInfoEditor, ExperienceEditor, EducationEditor, CertificationsEditor,
  ProjectsEditor, LanguagesEditor, VolunteerEditor, ReferencesEditor,
} from "@/components/cv/section-editors";
import {
  analyzeCvAgainstJob, deleteCv, duplicateCv, generateCvSummaryWithAI, saveCv,
} from "../actions";
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

interface AnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  missingSkills: string[];
  weakSections: string[];
  suggestions: { section: string; suggestion: string; requiresVerification: boolean }[];
  atsRecommendations: string[];
  improvedSummary: string;
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

  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeTemplate = templates.find((t) => t.id === templateId) ?? null;
  const templateConfig = useMemo(() => parseTemplateConfig(activeTemplate?.config), [activeTemplate]);

  function update<K extends keyof CVContent>(key: K, value: CVContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
  }

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
    if (!confirm("Delete this CV? This cannot be undone.")) return;
    setBusyAction("delete");
    const res = await deleteCv(cvId);
    setBusyAction(null);
    if (res.ok) router.push("/dashboard/cvs");
  }

  async function handleGenerateSummary() {
    setGenerating(true);
    setAiError(null);
    setSummarySuggestion(null);
    const res = await generateCvSummaryWithAI({ cvId, content, targetJobDescription: jobDescription || undefined });
    setGenerating(false);
    if (!res.ok) setAiError(res.error);
    else setSummarySuggestion(res.data.professionalSummary);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAiError(null);
    setAnalysis(null);
    const res = await analyzeCvAgainstJob({ cvId, content, jobDescription });
    setAnalyzing(false);
    if (!res.ok) setAiError(res.error);
    else setAnalysis(res.data);
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
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={busyAction === "duplicate"}>
            <Copy className="size-4" /> Duplicate
          </Button>
          {cleanExport ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/cv/${cvId}/pdf`} target="_blank" rel="noreferrer">
                <Download className="size-4" /> Download PDF
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleUnlock} disabled={unlocking}>
              {unlocking ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Download PDF — {unlockPriceLabel}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={busyAction === "delete"} className="text-destructive hover:text-destructive">
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

      <details className="group mb-6 rounded-lg border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="font-display text-base font-semibold">AI Career Tools</span>
            <span className="text-xs text-muted-foreground">— tailor this CV to a specific job</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t p-4">
          <LabeledTextarea
            label="Target job description"
            value={jobDescription}
            onChange={setJobDescription}
            rows={5}
            placeholder="Paste the full job advert here. The AI uses it to rewrite your summary and score how well this CV matches."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleGenerateSummary} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Suggest a professional summary
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyze against this job
            </Button>
          </div>

          {aiError ? (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          ) : null}

          {summarySuggestion ? (
            <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3">
              <Badge className="mb-2">AI-generated — review before use</Badge>
              <p className="text-sm">{summarySuggestion}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    update("professionalSummary", summarySuggestion);
                    setSummarySuggestion(null);
                    handleSave("ai: summary suggestion accepted");
                  }}
                >
                  Use this
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSummarySuggestion(null)}>Discard</Button>
              </div>
            </div>
          ) : null}

          {analysis ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold">{analysis.matchScore}%</span>
                <span className="text-muted-foreground">match to this job</span>
              </div>
              {analysis.missingKeywords.length ? (
                <p><span className="font-medium">Missing keywords:</span> {analysis.missingKeywords.join(", ")}</p>
              ) : null}
              {analysis.missingSkills.length ? (
                <p><span className="font-medium">Missing skills:</span> {analysis.missingSkills.join(", ")}</p>
              ) : null}
              {analysis.weakSections.length ? (
                <p><span className="font-medium">Weak sections:</span> {analysis.weakSections.join(", ")}</p>
              ) : null}
              {analysis.suggestions.length ? (
                <ul className="list-inside list-disc space-y-1">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i}>
                      <span className="font-medium">{s.section}:</span> {s.suggestion}
                      {s.requiresVerification ? <Badge variant="warning" className="ml-1">verify</Badge> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {analysis.atsRecommendations.length ? (
                <p><span className="font-medium">ATS tips:</span> {analysis.atsRecommendations.join(", ")}</p>
              ) : null}
              {analysis.improvedSummary ? (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <Badge className="mb-2">AI-generated — review before use</Badge>
                  <p>{analysis.improvedSummary}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      update("professionalSummary", analysis.improvedSummary);
                      handleSave("ai: improved summary accepted");
                    }}
                  >
                    Use this summary
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </details>

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
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview · A4</p>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Maximize2 className="size-3.5" /> Enlarge
              </Button>
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
              className="cursor-zoom-in overflow-hidden rounded outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div style={{ zoom: PREVIEW_SCALE }}>
                <CvPreview content={content} template={templateConfig} watermark={!cleanExport} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Maximize2 className="size-3.5" /> Preview CV
        </Button>
      </div>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="mx-auto flex w-full max-w-[900px] items-center justify-between py-2 text-white">
            <p className="text-sm font-medium">Live preview — {title || "Untitled CV"}</p>
            <div className="flex items-center gap-2">
              {cleanExport ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={`/api/cv/${cvId}/pdf`} target="_blank" rel="noreferrer">
                    <Download className="size-4" /> Download PDF
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleUnlock} disabled={unlocking}>
                  {unlocking ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                  Download PDF — {unlockPriceLabel}
                </Button>
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
