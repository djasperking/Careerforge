"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Pencil, Video, FileText, FileDown, ClipboardCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  createModule, updateModule, deleteModule, moveModule,
  createLesson, updateLesson, deleteLesson, moveLesson,
} from "../actions";

type LessonType = "VIDEO" | "TEXT" | "PDF" | "QUIZ" | "ASSIGNMENT" | "EXAM";

interface LessonRow {
  id: string;
  title: string;
  type: LessonType;
  videoUrl: string | null;
  content: string | null;
  durationSeconds: number;
  isPreview: boolean;
  position: number;
}
interface ModuleRow {
  id: string;
  title: string;
  position: number;
  lessons: LessonRow[];
}

const TYPE_ICON: Record<LessonType, React.ElementType> = {
  VIDEO: Video, TEXT: FileText, PDF: FileDown, QUIZ: ClipboardCheck, ASSIGNMENT: ClipboardCheck, EXAM: GraduationCap,
};

export function ModuleManager({ courseId, modules }: { courseId: string; modules: ModuleRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    start(async () => {
      await createModule(courseId, { title: newModuleTitle });
      setNewModuleTitle("");
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      {modules.map((m, i) => (
        <ModuleCard
          key={m.id}
          courseId={courseId}
          module={m}
          isFirst={i === 0}
          isLast={i === modules.length - 1}
          editing={editingModule === m.id}
          setEditing={(v) => setEditingModule(v ? m.id : null)}
          addingLesson={addingLessonTo === m.id}
          setAddingLesson={(v) => setAddingLessonTo(v ? m.id : null)}
          editingLesson={editingLesson}
          setEditingLesson={setEditingLesson}
          onChanged={refresh}
        />
      ))}

      <Card>
        <CardContent className="flex items-center gap-2 p-4">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="New module title"
          />
          <Button onClick={handleAddModule} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add module
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({
  courseId, module: m, isFirst, isLast, editing, setEditing, addingLesson, setAddingLesson,
  editingLesson, setEditingLesson, onChanged,
}: {
  courseId: string;
  module: ModuleRow;
  isFirst: boolean;
  isLast: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  addingLesson: boolean;
  setAddingLesson: (v: boolean) => void;
  editingLesson: string | null;
  setEditingLesson: (id: string | null) => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState(m.title);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <button disabled={isFirst} onClick={() => start(async () => { await moveModule(m.id, courseId, "up"); onChanged(); })} className="text-muted-foreground disabled:opacity-30">
              <ChevronUp className="size-4" />
            </button>
            <button disabled={isLast} onClick={() => start(async () => { await moveModule(m.id, courseId, "down"); onChanged(); })} className="text-muted-foreground disabled:opacity-30">
              <ChevronDown className="size-4" />
            </button>
          </div>

          {editing ? (
            <>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
              <Button size="sm" disabled={pending} onClick={() => start(async () => { await updateModule(m.id, courseId, { title }); setEditing(false); onChanged(); })}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <p className="flex-1 font-medium">{m.title}</p>
              <Button size="icon" variant="ghost" onClick={() => setEditing(true)}><Pencil className="size-4" /></Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => { if (confirm("Delete this module and all its lessons?")) start(async () => { await deleteModule(m.id, courseId); onChanged(); }); }}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>

        <div className="ml-6 mt-3 space-y-2 border-l pl-4">
          {m.lessons.map((l, i) => (
            <LessonRow
              key={l.id}
              courseId={courseId}
              moduleId={m.id}
              lesson={l}
              isFirst={i === 0}
              isLast={i === m.lessons.length - 1}
              editing={editingLesson === l.id}
              setEditing={(v) => setEditingLesson(v ? l.id : null)}
              onChanged={onChanged}
            />
          ))}

          {addingLesson ? (
            <LessonEditor
              courseId={courseId}
              moduleId={m.id}
              onDone={() => { setAddingLesson(false); onChanged(); }}
              onCancel={() => setAddingLesson(false)}
            />
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAddingLesson(true)}>
              <Plus className="size-4" /> Add lesson
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LessonRow({
  courseId, moduleId, lesson: l, isFirst, isLast, editing, setEditing, onChanged,
}: {
  courseId: string;
  moduleId: string;
  lesson: LessonRow;
  isFirst: boolean;
  isLast: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  const Icon = TYPE_ICON[l.type];

  if (editing) {
    return (
      <LessonEditor
        courseId={courseId}
        moduleId={moduleId}
        lesson={l}
        onDone={() => { setEditing(false); onChanged(); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
      <div className="flex flex-col">
        <button disabled={isFirst} onClick={() => start(async () => { await moveLesson(l.id, moduleId, courseId, "up"); onChanged(); })} className="text-muted-foreground disabled:opacity-30">
          <ChevronUp className="size-3.5" />
        </button>
        <button disabled={isLast} onClick={() => start(async () => { await moveLesson(l.id, moduleId, courseId, "down"); onChanged(); })} className="text-muted-foreground disabled:opacity-30">
          <ChevronDown className="size-3.5" />
        </button>
      </div>
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1">{l.title}</span>
      {l.isPreview ? <Badge variant="secondary">Preview</Badge> : null}
      <Badge variant="outline">{l.type}</Badge>
      <Button size="icon" variant="ghost" onClick={() => setEditing(true)}><Pencil className="size-3.5" /></Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={pending}
        className="text-destructive hover:text-destructive"
        onClick={() => { if (confirm("Delete this lesson?")) start(async () => { await deleteLesson(l.id, courseId); onChanged(); }); }}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function LessonEditor({
  courseId, moduleId, lesson, onDone, onCancel,
}: {
  courseId: string;
  moduleId: string;
  lesson?: LessonRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: lesson?.title ?? "",
    type: lesson?.type ?? ("VIDEO" as LessonType),
    videoUrl: lesson?.videoUrl ?? "",
    content: lesson?.content ?? "",
    durationSeconds: lesson?.durationSeconds ?? 0,
    isPreview: lesson?.isPreview ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (form.title.trim().length < 2) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = lesson
      ? await updateLesson(lesson.id, courseId, form)
      : await createLesson(moduleId, courseId, form);
    setSaving(false);
    if (!res.ok) setError(res.error);
    else onDone();
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LessonType }))}
            className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="VIDEO">Video</option>
            <option value="TEXT">Text lesson</option>
            <option value="PDF">PDF</option>
            <option value="QUIZ">Quiz</option>
            <option value="ASSIGNMENT">Assignment</option>
            <option value="EXAM">Exam</option>
          </select>
        </div>
      </div>

      {form.type === "VIDEO" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Video URL</Label>
            <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} className="h-8" placeholder="https://…/video.mp4" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration (seconds)</Label>
            <Input type="number" min={0} value={form.durationSeconds} onChange={(e) => setForm((f) => ({ ...f, durationSeconds: Number(e.target.value) }))} className="h-8" />
          </div>
        </div>
      ) : null}

      {form.type === "PDF" ? (
        <div className="space-y-1">
          <Label className="text-xs">PDF URL</Label>
          <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} className="h-8" placeholder="https://…/resource.pdf" />
        </div>
      ) : null}

      {form.type === "TEXT" ? (
        <div className="space-y-1">
          <Label className="text-xs">Content</Label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={4}
            className="flex w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm"
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={form.isPreview} onChange={(e) => setForm((f) => ({ ...f, isPreview: e.target.checked }))} className="size-3.5" />
        Free preview (visible without enrolling)
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save lesson"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
