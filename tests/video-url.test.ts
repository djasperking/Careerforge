import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "@/lib/marketplace/video";

describe("parseVideoUrl", () => {
  it("parses YouTube watch, short and youtu.be links to a no-cookie embed", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      expect(parseVideoUrl(url)).toEqual({
        provider: "youtube",
        embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      });
    }
  });

  it("parses Vimeo links", () => {
    expect(parseVideoUrl("https://vimeo.com/824804225")).toEqual({
      provider: "vimeo",
      embedUrl: "https://player.vimeo.com/video/824804225",
    });
  });

  it("parses Loom share links", () => {
    expect(parseVideoUrl("https://www.loom.com/share/abc123def456")).toEqual({
      provider: "loom",
      embedUrl: "https://www.loom.com/embed/abc123def456",
    });
  });

  it("rejects unknown or malformed links", () => {
    expect(parseVideoUrl("https://example.com/video.mp4")).toBeNull();
    expect(parseVideoUrl("not a url")).toBeNull();
    expect(parseVideoUrl("")).toBeNull();
  });
});
