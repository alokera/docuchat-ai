export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Chunks retrieved for this answer (assistant messages only; never sent back to the server). */
  sources?: RetrievedChunk[];
}

export interface ParsedDocument {
  name: string;
  pageCount: number;
  /** Text of each page, in order. Kept per-page so answers can cite page numbers. */
  pages: string[];
}

/** A small, overlapping piece of a page — the unit we embed and retrieve. */
export interface Chunk {
  id: string;
  /** 1-based page number the chunk came from. */
  page: number;
  text: string;
}

export interface RetrievedChunk extends Chunk {
  /** Cosine similarity to the question, from -1 to 1. */
  score: number;
}

/** What the chat API needs from each retrieved chunk. */
export interface SourceExcerpt {
  page: number;
  text: string;
}

export interface UploadResponse {
  document: ParsedDocument;
  chunks: Chunk[];
  /** True when the document produced more than MAX_CHUNKS chunks and the rest were dropped. */
  truncated: boolean;
}
