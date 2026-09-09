import { ApiError } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Pull plain text out of an uploaded document (PDF, DOCX or plain text).
 * Server-side only — `unpdf` and `mammoth` are Node packages. Images, layout
 * and formatting are lost; scanned/image PDFs yield nothing.
 */
export async function extractDocumentText(
  file: File,
  opts: { maxChars?: number; noun?: string } = {},
): Promise<string> {
  const maxChars = opts.maxChars ?? 30_000;
  const noun = opts.noun ?? "file";

  if (file.size > MAX_BYTES) {
    throw new ApiError(413, "FILE_TOO_LARGE", `That ${noun} is over 5 MB. Upload a smaller one.`);
  }
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text: pages } = await extractText(pdf, { mergePages: true });
    text = Array.isArray(pages) ? pages.join("\n") : pages;
  } else if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    text = value;
  } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    text = buf.toString("utf8");
  } else {
    throw new ApiError(415, "UNSUPPORTED_FILE", `Upload a PDF, Word (.docx) or plain-text ${noun}.`);
  }

  text = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 80) {
    throw new ApiError(
      422,
      "NO_TEXT",
      `Couldn't read any text from that ${noun}. If it's a scanned PDF, paste the text instead.`,
    );
  }
  return text.slice(0, maxChars);
}
