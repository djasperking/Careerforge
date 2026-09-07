"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { Loader2, CheckCircle2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "creating" | "uploading" | "processing" | "ready" | "error";

const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export function HostedVideoField({
  assetId,
  durationSec,
  disabled,
  onChange,
}: {
  assetId: string;
  durationSec: number;
  disabled?: boolean;
  onChange: (v: { assetId: string; durationSec: number }) => void;
}) {
  const [phase, setPhase] = useState<Phase>(assetId ? "ready" : "idle");
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  async function pollUntilReady(guid: string) {
    setPhase("processing");
    for (let i = 0; i < 240; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/video/bunny/${guid}`);
        const json = await res.json();
        if (json.data?.failed) {
          setPhase("error");
          setError("The video failed to process. Try a different file.");
          return;
        }
        if (json.data?.ready) {
          onChange({ assetId: guid, durationSec: json.data.durationSec ?? 0 });
          setPhase("ready");
          return;
        }
      } catch {
        /* keep polling */
      }
    }
    // Give up waiting but keep the asset — encoding usually finishes eventually.
    onChange({ assetId: guid, durationSec: 0 });
    setPhase("ready");
  }

  async function start(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("That file is over the 5 GB limit.");
      return;
    }
    setPhase("creating");
    setPct(0);
    try {
      const res = await fetch("/api/video/bunny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.data?.upload) {
        throw new Error(json.error?.message || "Could not start the upload.");
      }
      const { guid, upload } = json.data as {
        guid: string;
        upload: { endpoint: string; libraryId: string; videoId: string; signature: string; expires: number };
      };

      const up = new tus.Upload(file, {
        endpoint: upload.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: upload.signature,
          AuthorizationExpire: String(upload.expires),
          VideoId: upload.videoId,
          LibraryId: upload.libraryId,
        },
        metadata: { filetype: file.type, title: file.name },
        onError: (err) => {
          console.error(err);
          setPhase("error");
          setError("The upload failed. Check your connection and try again.");
        },
        onProgress: (sent, total) => {
          setPct(Math.round((sent / total) * 100));
        },
        onSuccess: () => {
          void pollUntilReady(guid);
        },
      });
      uploadRef.current = up;
      setPhase("uploading");
      up.start();
    } catch (err) {
      setPhase("error");
      setError((err as Error).message);
    }
  }

  function cancel() {
    uploadRef.current?.abort();
    uploadRef.current = null;
    setPhase("idle");
    setPct(0);
  }

  if (phase === "ready") {
    return (
      <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-success" />
          Video uploaded{durationSec ? ` · ${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : ""}
        </span>
        {!disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({ assetId: "", durationSec: 0 });
              setPhase("idle");
            }}
          >
            Replace
          </Button>
        ) : null}
      </div>
    );
  }

  if (phase === "uploading" || phase === "processing" || phase === "creating") {
    return (
      <div className="space-y-2 rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {phase === "creating"
              ? "Preparing upload…"
              : phase === "uploading"
                ? `Uploading… ${pct}%`
                : "Processing video… you can keep editing; this can take a few minutes."}
          </span>
          {phase === "uploading" ? (
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
        {phase === "uploading" ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label
        className={`flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm hover:bg-muted ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <UploadCloud className="size-4" />
        Choose a video file (MP4, MOV or WebM · up to 5 GB)
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void start(f);
            e.target.value = "";
          }}
        />
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Hosted on Career Forge&apos;s video CDN. Buyers stream it on a signed, expiring link — no download button, locked to
        our domain.
      </p>
    </div>
  );
}
