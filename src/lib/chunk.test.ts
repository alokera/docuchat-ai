import { describe, expect, it } from "vitest";
import { chunkPages, splitText } from "./chunk";

const sentence = (n: number) => `This is sentence number ${n} of the test document.`;
const longText = Array.from({ length: 60 }, (_, i) => sentence(i)).join(" ");

describe("splitText", () => {
  it("returns short text as a single chunk", () => {
    expect(splitText("  hello world  ", 100, 20)).toEqual(["hello world"]);
  });

  it("returns nothing for empty text", () => {
    expect(splitText("   ", 100, 20)).toEqual([]);
  });

  it("keeps every chunk within the size limit", () => {
    const chunks = splitText(longText, 300, 50);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(300);
  });

  it("covers the whole text, with neighbouring chunks overlapping", () => {
    const chunks = splitText(longText, 300, 50);
    expect(chunks[0].startsWith("This is sentence number 0")).toBe(true);
    expect(chunks.at(-1)!.endsWith(sentence(59))).toBe(true);
    for (let i = 1; i < chunks.length; i++) {
      const tail = chunks[i - 1].slice(-20);
      expect(chunks[i]).toContain(tail.trim().split(" ").at(-1));
    }
  });

  it("prefers to break at sentence boundaries", () => {
    const chunks = splitText(longText, 300, 50);
    for (const chunk of chunks.slice(0, -1)) expect(chunk.endsWith(".")).toBe(true);
  });

  it("starts overlapping chunks at a sentence boundary when one is available", () => {
    for (const chunk of splitText(longText, 300, 80)) expect(chunk.startsWith("This is sentence")).toBe(true);
  });

  it("never starts a chunk mid-word", () => {
    const words = new Set(longText.split(" "));
    for (const chunk of splitText(longText, 300, 50)) expect(words.has(chunk.split(" ")[0])).toBe(true);
  });

  it("terminates on text without any separators", () => {
    const chunks = splitText("x".repeat(1000), 300, 50);
    expect(chunks.join("").length).toBeGreaterThanOrEqual(1000);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(300);
  });
});

describe("chunkPages", () => {
  it("tags chunks with 1-based page numbers and unique ids", () => {
    const chunks = chunkPages(["first page", "", longText], { size: 300, overlap: 50 });
    expect(chunks[0]).toEqual({ id: "1-0", page: 1, text: "first page" });
    expect(chunks.slice(1).every((c) => c.page === 3)).toBe(true);
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
  });

  it("rejects overlap >= size", () => {
    expect(() => chunkPages(["text"], { size: 100, overlap: 100 })).toThrow();
  });
});
