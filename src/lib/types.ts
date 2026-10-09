export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ParsedDocument {
  name: string;
  pageCount: number;
  /** Text of each page, in order. Kept per-page so answers can cite page numbers. */
  pages: string[];
}

export interface UploadResponse {
  document: ParsedDocument;
  /** True when the document exceeds MAX_DOC_CHARS and will be cut off in the prompt. */
  truncated: boolean;
}
