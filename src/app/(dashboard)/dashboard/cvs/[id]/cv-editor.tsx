"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download, Copy, Trash2, Save, Sparkles, Loader2, ArrowLeft, ChevronRight,
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
          <Button asChild variant="outline" size="sm">
            <a href={`/api/cv/${cvId}/pdf`} target="_blank" rel="noreferrer">
              <Download className="size-4" /> Download PDF
            </a>
          </Button>
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

      <div className="grid gap-6 lg:grid-cols-[200px_1fr_460px]">
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

          <CardContent className="border-t p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-display text-base font-semibold">AI Career Tools</h3>
            </div>
            <LabeledTextarea
              label="Target job description (optional)"
              value={jobDescription}
              onChange={setJobDescription}
              rows={4}
              placeholder="Paste a job description to tailor suggestions to it."
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
          </CardContent>
        </Card>

        <div className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border bg-muted/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview · A4</p>
            </div>
            {!cleanExport ? (
              <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium">Unlock this CV — {unlockPriceLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  One-time payment. Removes the watermark from this CV&apos;s preview and PDF. No subscription.
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
            <div style={{ zoom: PREVIEW_SCALE }}>
              <CvPreview content={content} template={templateConfig} watermark={!cleanExport} />
            </div>
          </div>
        </div>
      </div>
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
