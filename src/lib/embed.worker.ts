// Runs the embedding model off the main thread so the UI stays responsive.
import { pipeline } from "@huggingface/transformers";
import type { EmbedWorkerRequest, EmbedWorkerResponse } from "./embedder";

// Small (≈23 MB quantized), fast sentence-embedding model producing 384-dim vectors.
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const BATCH_SIZE = 16;

function post(message: EmbedWorkerResponse) {
  self.postMessage(message);
}

function loadExtractor() {
  return pipeline("feature-extraction", MODEL_ID, {
    dtype: "q8",
    progress_callback: (info) => {
      if (info.status === "progress" && info.file.endsWith(".onnx")) {
        post({ type: "model-progress", percent: Math.round(info.progress) });
      }
    },
  });
}

let extractor: ReturnType<typeof loadExtractor> | null = null;

self.onmessage = async (event: MessageEvent<EmbedWorkerRequest>) => {
  const { id, texts } = event.data;
  try {
    extractor ??= loadExtractor();
    const extract = await extractor;

    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      // Mean pooling + L2 normalization turns token embeddings into one unit-length sentence vector.
      const output = await extract(texts.slice(i, i + BATCH_SIZE), { pooling: "mean", normalize: true });
      vectors.push(...(output.tolist() as number[][]));
      post({ type: "progress", id, done: vectors.length, total: texts.length });
    }
    post({ type: "result", id, vectors });
  } catch (error) {
    extractor = null; // allow a retry, e.g. after a network failure downloading the model
    post({ type: "error", id, message: error instanceof Error ? error.message : "Embedding failed." });
  }
};
