import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { handler, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { parseCvContent, parseTemplateConfig } from "@/lib/cv/schema";
import { cvHasCleanExport } from "@/lib/cv/service";
import { CvPdfDocument } from "@/lib/cv/pdf";
import { slugify } from "@/lib/utils";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;

  const cv = await db.cV.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: { template: true },
  });
  if (!cv) throw new ApiError(404, "NOT_FOUND", "CV not found.");

  const clean = await cvHasCleanExport(user.id, cv);
  if (!clean) {
    throw new ApiError(
      402,
      "PAYMENT_REQUIRED",
      "Unlock this CV to download it — a one-time payment, or subscribe for all your CVs.",
    );
  }

  const content = parseCvContent(cv.content);
  const template = parseTemplateConfig(cv.template?.config);
  const buffer = await renderToBuffer(<CvPdfDocument content={content} template={template} watermark={false} />);

  const filename = `${slugify(cv.title || "cv") || "cv"}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
