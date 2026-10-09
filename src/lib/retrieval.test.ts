import { describe, expect, it } from "vitest";
import { buildRetrievalQuery, cosineSimilarity, retrieve } from "./retrieval";

describe("cosineSimilarity", () => {
  it("is 1 for same direction, 0 for orthogonal, -1 for opposite", () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 3])).toBeCloseTo(0);
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  it("returns 0 for a zero vector", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("throws on mismatched lengths", () => {
    expect(() => cosineSimilarity([1], [1, 2])).toThrow();
  });
});

describe("retrieve", () => {
  const index = {
    chunks: [
      { id: "a", page: 1, text: "about cats" },
      { id: "b", page: 2, text: "about dogs" },
      { id: "c", page: 3, text: "about cars" },
    ],
    vectors: [new Float32Array([1, 0, 0]), new Float32Array([0.8, 0.6, 0]), new Float32Array([0, 0, 1])],
  };

  it("returns the top-k chunks ordered by similarity", () => {
    const results = retrieve(index, [1, 0.1, 0], 2);
    expect(results.map((r) => r.id)).toEqual(["a", "b"]);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("returns all chunks when k exceeds the index size", () => {
    expect(retrieve(index, [0, 0, 1], 10)).toHaveLength(3);
  });
});

describe("buildRetrievalQuery", () => {
  it("combines the last two user questions", () => {
    const query = buildRetrievalQuery([
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "q2" },
      { role: "assistant", content: "a2" },
      { role: "user", content: "tell me more" },
    ]);
    expect(query).toBe("q2\ntell me more");
  });
});
