import { extractDocumentText } from "@/lib/text-extract";

/**
 * Pull plain text out of an uploaded CV file (PDF, DOCX or plain text).
 * Thin wrapper over the shared document-text extractor.
 */
export function extractCvText(file: File): Promise<string> {
  return extractDocumentText(file, { maxChars: 30_000, noun: "CV" });
}
