import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const alt = "Career Forge course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture that appears when a course link is shared on WhatsApp, X, Facebook or LinkedIn. */
export default async function CourseOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await db.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, level: true, priceCents: true, durationMinutes: true },
  });
  const title = course?.title ?? "Career Forge course";
  const free = course ? course.priceCents === 0 : false;
  const level = course ? course.level.charAt(0) + course.level.slice(1).toLowerCase() : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 70,
          background: "linear-gradient(135deg, #4c1d95 0%, #be185d 55%, #f97316 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, color: "#fde68a", fontWeight: 700 }}>CAREER FORGE</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: title.length > 48 ? 58 : 72, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 36, gap: 16 }}>
            {free ? (
              <div style={{ display: "flex", background: "#fde047", color: "#3b0764", padding: "10px 28px", borderRadius: 40, fontSize: 34, fontWeight: 800 }}>
                FREE
              </div>
            ) : null}
            {level ? (
              <div style={{ display: "flex", background: "white", color: "#be185d", padding: "10px 28px", borderRadius: 40, fontSize: 34, fontWeight: 700 }}>
                {level}
              </div>
            ) : null}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.22)", padding: "10px 28px", borderRadius: 40, fontSize: 34, fontWeight: 700 }}>
              Certificate included
            </div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.92 }}>careerforge.com.ng</div>
      </div>
    ),
    size,
  );
}
