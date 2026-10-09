import type { SourceExcerpt } from "./types";

/**
 * v0.2 RAG prompt: instead of the whole document, the model only sees the
 * excerpts retrieved as most similar to the question.
 */
export function buildSystemPrompt(documentName: string, sources: SourceExcerpt[]): string {
  const excerpts = sources.map((s, i) => `[Excerpt ${i + 1} | Page ${s.page}]\n${s.text}`).join("\n\n");
  return [
    `You are a helpful assistant that answers questions about the document "${documentName}".`,
    "You are given excerpts retrieved from the document as the most relevant to the user's latest question.",
    "Rules:",
    "- Answer ONLY using information from the excerpts below.",
    '- If the excerpts don\'t contain the answer, say "I couldn\'t find that in the document." Do not guess.',
    "- Cite the page number(s) you used, e.g. (p. 3).",
    "- Be concise. Use markdown lists when helpful.",
    "",
    "<excerpts>",
    excerpts,
    "</excerpts>",
  ].join("\n");
}
