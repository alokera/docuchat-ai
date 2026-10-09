import type { ChatMessage, Chunk, RetrievedChunk } from "./types";

/** An in-memory vector index: chunks[i] is described by vectors[i]. */
export interface VectorIndex {
  chunks: Chunk[];
  vectors: ArrayLike<number>[];
}

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Brute-force nearest-neighbour search: score every chunk and keep the best `k`.
 * O(n) per query is fine for a single document (a few thousand chunks); a vector
 * database with an ANN index (e.g. pgvector HNSW) is the next step at larger scale.
 */
export function retrieve(index: VectorIndex, query: ArrayLike<number>, k = 5): RetrievedChunk[] {
  return index.chunks
    .map((chunk, i) => ({ ...chunk, score: cosineSimilarity(index.vectors[i], query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Follow-ups like "tell me more" retrieve poorly on their own, so the previous
 * question is included to give the embedding some conversational context.
 */
export function buildRetrievalQuery(messages: ChatMessage[]): string {
  const questions = messages.filter((m) => m.role === "user").map((m) => m.content);
  return questions.slice(-2).join("\n");
}
