// Browser-side client for the embedding Web Worker.

export type EmbedWorkerRequest = { id: number; texts: string[] };

export type EmbedWorkerResponse =
  | { type: "model-progress"; percent: number }
  | { type: "progress"; id: number; done: number; total: number }
  | { type: "result"; id: number; vectors: number[][] }
  | { type: "error"; id: number; message: string };

export type EmbedProgress =
  | { stage: "loading-model"; percent: number }
  | { stage: "embedding"; done: number; total: number };

interface PendingRequest {
  resolve: (vectors: Float32Array[]) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: EmbedProgress) => void;
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingRequest>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL("./embed.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<EmbedWorkerResponse>) => {
    const message = event.data;
    if (message.type === "model-progress") {
      // The model loads once and is shared, so report download progress to every waiting caller.
      pending.forEach((p) => p.onProgress?.({ stage: "loading-model", percent: message.percent }));
      return;
    }

    const request = pending.get(message.id);
    if (!request) return;
    if (message.type === "progress") {
      request.onProgress?.({ stage: "embedding", done: message.done, total: message.total });
    } else if (message.type === "result") {
      pending.delete(message.id);
      request.resolve(message.vectors.map((v) => Float32Array.from(v)));
    } else {
      pending.delete(message.id);
      request.reject(new Error(message.message));
    }
  };
  worker.onerror = (event) => {
    pending.forEach((p) => p.reject(new Error(event.message || "Embedding worker crashed.")));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

/** Embeds texts into unit-length vectors. The model is downloaded on first use, then cached by the browser. */
export function embed(texts: string[], onProgress?: (progress: EmbedProgress) => void): Promise<Float32Array[]> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, texts } satisfies EmbedWorkerRequest);
  });
}
