import type { Chunk } from "./types";

export const CHUNK_SIZE = 1000; // characters (~250 tokens)
export const CHUNK_OVERLAP = 200; // repeated between neighbours so sentences aren't cut off from their context
export const MAX_CHUNKS = 1500; // caps embedding time in the browser for very large documents

interface ChunkOptions {
  size?: number;
  overlap?: number;
}

/**
 * Splits each page into overlapping chunks. Chunks never span pages, so every
 * chunk maps to exactly one page number for citations.
 */
export function chunkPages(pages: string[], { size = CHUNK_SIZE, overlap = CHUNK_OVERLAP }: ChunkOptions = {}): Chunk[] {
  if (overlap >= size) throw new Error("overlap must be smaller than size");

  const chunks: Chunk[] = [];
  pages.forEach((pageText, pageIndex) => {
    splitText(pageText, size, overlap).forEach((text, i) => {
      chunks.push({ id: `${pageIndex + 1}-${i}`, page: pageIndex + 1, text });
    });
  });
  return chunks;
}

export function splitText(text: string, size: number, overlap: number): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const parts: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) end = findBreak(clean, start + Math.floor(size / 2), end);

    parts.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;

    start = Math.max(findOverlapStart(clean, end - overlap, end), start + 1);
  }
  return parts.filter(Boolean);
}

/**
 * Steps back by the overlap, then forward to the first sentence start in [min, max]
 * (or, failing that, the first word start) so chunks don't begin mid-sentence or mid-word.
 */
function findOverlapStart(text: string, min: number, max: number): number {
  const window = text.slice(min, max);
  const sentenceEnd = window.search(/[.?!]\s/);
  if (sentenceEnd !== -1) return min + sentenceEnd + 2;
  const space = window.indexOf(" ");
  return space !== -1 ? min + space + 1 : min;
}

/** Prefers to end a chunk at a paragraph, then sentence, then word boundary within [min, max]. */
function findBreak(text: string, min: number, max: number): number {
  const window = text.slice(min, max);
  for (const separator of ["\n\n", "\n", ". ", "? ", "! ", " "]) {
    const index = window.lastIndexOf(separator);
    if (index !== -1) return min + index + separator.length;
  }
  return max;
}
