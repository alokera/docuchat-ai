import type { ParsedDocument } from "./types";

export const MAX_DOC_CHARS = Number(process.env.MAX_DOC_CHARS) || 200_000;

/**
 * v0.1 "context stuffing": the whole document goes into the system prompt.
 * This breaks down for large documents (context limits, cost), which is exactly
 * what v0.2 (chunking + embeddings + retrieval) will fix.
 */
export function buildDocumentContext(doc: ParsedDocument): { context: string; truncated: boolean } {
  const full = doc.pages.map((text, i) => `[Page ${i + 1}]\n${text}`).join("\n\n");
  const truncated = full.length > MAX_DOC_CHARS;
  return { context: truncated ? full.slice(0, MAX_DOC_CHARS) : full, truncated };
}

export function buildSystemPrompt(doc: ParsedDocument): string {
  const { context, truncated } = buildDocumentContext(doc);
  return [
    "You are a helpful assistant that answers questions about a document the user uploaded.",
    "Rules:",
    "- Answer ONLY using information from the document below.",
    '- If the answer is not in the document, say "I couldn\'t find that in the document." Do not guess.',
    "- When possible, cite the page number(s) you used, e.g. (p. 3).",
    "- Be concise. Use markdown lists when helpful.",
    truncated ? "- Note: the document was truncated because it is very long; later pages are missing." : null,
    "",
    `Document name: ${doc.name}`,
    "<document>",
    context,
    "</document>",
  ]
    .filter((line) => line !== null)
    .join("\n");
}
