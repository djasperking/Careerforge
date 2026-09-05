import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { handler, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { env } from "@/lib/env";
import { CertificatePdfDocument } from "@/lib/certificate/pdf";
import { slugify } from "@/lib/utils";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;

  const cert = await db.certificate.findUnique({ where: { id } });
  if (!cert || cert.userId !== user.id) throw new ApiError(404, "NOT_FOUND", "Certificate not found.");

  const buffer = await renderToBuffer(
    <CertificatePdfDocument
      studentName={cert.studentName}
      title={cert.title}
      issuerName={cert.issuerName}
      completionDate={cert.completionDate}
      publicId={cert.publicId}
      verifyUrl={`${env.NEXT_PUBLIC_APP_URL}/verify/${cert.publicId}`}
    />,
  );

  const filename = `${slugify(cert.title) || "certificate"}-${cert.publicId}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
