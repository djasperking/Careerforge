import { ApiError } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CHARS = 30_000;

/**
 * Pull plain text out of an uploaded CV file (PDF, DOCX or plain text).
 * Runs server-side only — `unpdf` and `mammoth` are Node packages.
 */
export async function extractCvText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new ApiError(413, "FILE_TOO_LARGE", "That file is over 5 MB. Upload a smaller CV.");
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
    throw new ApiError(415, "UNSUPPORTED_FILE", "Upload a PDF, Word (.docx) or plain-text CV.");
  }

  text = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 80) {
    throw new ApiError(422, "NO_TEXT", "Couldn't read any text from that file. If it's a scanned PDF, paste the text instead.");
  }
  return text.slice(0, MAX_CHARS);
}
