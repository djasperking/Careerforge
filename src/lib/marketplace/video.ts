/**
 * Parse a seller-pasted video URL (YouTube, Vimeo, Loom) into a privacy-friendly
 * embeddable player URL. Returns null when the link isn't a recognised host, so
 * callers can reject it at validation time.
 */
export type ParsedVideo = { provider: "youtube" | "vimeo" | "loom"; embedUrl: string };

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const input = raw.trim();
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube: watch?v=, youtu.be/<id>, /shorts/<id>, /embed/<id>
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id =
      url.searchParams.get("v") ||
      url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1] ||
      null;
    if (id) return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (id) return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  // Vimeo: vimeo.com/<id>, player.vimeo.com/video/<id>
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` };
  }

  // Loom: loom.com/share/<id>, loom.com/embed/<id>
  if (host === "loom.com") {
    const id = url.pathname.match(/^\/(?:share|embed)\/([\w-]+)/)?.[1];
    if (id) return { provider: "loom", embedUrl: `https://www.loom.com/embed/${id}` };
  }

  return null;
}
