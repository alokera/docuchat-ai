import { extractText, getDocumentProxy } from "unpdf";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".md"];

/** Extracts text from an uploaded file, returning one string per page. */
export async function parseFile(file: File): Promise<string[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: false });
    return text.map(normalizeWhitespace);
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    // Plain text has no pages, so treat it as a single page.
    return [normalizeWhitespace(await file.text())];
  }

  throw new Error(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
