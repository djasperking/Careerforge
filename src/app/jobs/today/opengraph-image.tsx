import { ImageResponse } from "next/og";
import { listRecentJobs } from "@/lib/jobs/service";

export const alt = "Remote & online jobs this week — Career Forge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Reads live job data — render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function Image() {
  let count = 0;
  let titles: string[] = [];
  try {
    const jobs = await listRecentJobs();
    count = jobs.length;
    titles = jobs.slice(0, 5).map((j) => j.title);
  } catch {
    // fall through to a generic card
  }

  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1e2a78 0%, #3446cb 55%, #5b6ef0 100%)",
          color: "white",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, opacity: 0.9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "white" }} />
          Career Forge · Jobs
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 34, opacity: 0.85 }}>This week · {date}</div>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
            {count > 0 ? `${count} remote & online jobs` : "Remote & online jobs"}
          </div>
          {titles.length > 0 ? (
            <div style={{ fontSize: 30, opacity: 0.9, marginTop: 8 }}>
              {titles.join("  ·  ").slice(0, 110)}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 30, opacity: 0.9 }}>Apply free — careerforge.com.ng/jobs/today</div>
      </div>
    ),
    size,
  );
}
