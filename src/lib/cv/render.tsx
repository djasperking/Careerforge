import { renderToBuffer } from "@react-pdf/renderer";
import { getDocumentProxy } from "unpdf";
import type { CVContent, CvTemplateConfig } from "./schema";
import { applyCondense, CONDENSE_MAX_STEPS } from "./condense";
import { CvPdfDocument } from "./pdf";

async function countPages(buffer: Buffer): Promise<number> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    return pdf.numPages;
  } catch {
    return 1;
  }
}

export interface CvRenderResult {
  buffer: Buffer;
  pages: number;
  /** Human phrases for what we trimmed to hit the target (empty if none). */
  trimmed: string[];
  /** True if we ran out of ladder steps and it still overflows the target. */
  stillOver: boolean;
}

/**
 * Render a CV to PDF. When `lengthTarget` is 1 or 2, walk the condense ladder
 * until the output fits that many A4 pages, then report what was trimmed.
 * `lengthTarget` 0 renders once, as-is.
 */
export async function renderCvPdf({
  content,
  template,
  watermark,
  lengthTarget,
}: {
  content: CVContent;
  template: CvTemplateConfig;
  watermark: boolean;
  lengthTarget: 0 | 1 | 2;
}): Promise<CvRenderResult> {
  // Cap total renders so a pathological CV can't stall the request. The first
  // ~6 ladder steps clear almost every real overflow.
  const MAX_RENDERS = 7;
  const maxSteps = lengthTarget === 0 ? 0 : Math.min(CONDENSE_MAX_STEPS, MAX_RENDERS - 1);

  let last: CvRenderResult | null = null;
  for (let step = 0; step <= maxSteps; step++) {
    const { content: c, hint, notes } = applyCondense(content, step);
    const buffer = await renderToBuffer(
      <CvPdfDocument content={c} template={template} watermark={watermark} condense={hint} />,
    );
    const pages = await countPages(buffer);
    last = { buffer, pages, trimmed: notes, stillOver: false };
    if (lengthTarget === 0 || pages <= lengthTarget) return last;
  }

  return { ...(last as CvRenderResult), stillOver: true };
}
