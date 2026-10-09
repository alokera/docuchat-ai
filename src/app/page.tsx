"use client";

import { useRef, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentPanel, type IndexStatus } from "@/components/DocumentPanel";
import { UploadDropzone } from "@/components/UploadDropzone";
import { embed } from "@/lib/embedder";
import type { VectorIndex } from "@/lib/retrieval";
import type { UploadResponse } from "@/lib/types";

export default function Home() {
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [index, setIndex] = useState<VectorIndex | null>(null);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>({ state: "idle" });
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null);
  // Incremented on every upload/reset so a slow, outdated indexing run can't overwrite newer state.
  const runId = useRef(0);

  async function handleUploaded(result: UploadResponse) {
    const run = ++runId.current;
    setUpload(result);
    setIndex(null);
    setIndexStatus({ state: "indexing", progress: null });

    try {
      const vectors = await embed(
        result.chunks.map((c) => c.text),
        (progress) => run === runId.current && setIndexStatus({ state: "indexing", progress }),
      );
      if (run !== runId.current) return;
      setIndex({ chunks: result.chunks, vectors });
      setIndexStatus({ state: "ready" });
    } catch (error) {
      if (run !== runId.current) return;
      setIndexStatus({ state: "error", message: error instanceof Error ? error.message : "Indexing failed." });
    }
  }

  function reset() {
    runId.current++;
    setUpload(null);
    setIndex(null);
    setIndexStatus({ state: "idle" });
    setHighlightedPage(null);
  }

  function showPage(page: number) {
    setHighlightedPage(page);
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 font-bold text-neutral-900">D</span>
        <h1 className="text-lg font-semibold">DocuChat AI</h1>
        <span className="ml-auto text-xs text-neutral-500">RAG · Powered by xAI Grok</span>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
        <section className="min-h-0 border-b border-neutral-200 md:border-b-0 md:border-r dark:border-neutral-800">
          {upload ? (
            <DocumentPanel
              document={upload.document}
              chunkCount={upload.chunks.length}
              truncated={upload.truncated}
              indexStatus={indexStatus}
              highlightedPage={highlightedPage}
              onReset={reset}
            />
          ) : (
            <UploadDropzone onUploaded={handleUploaded} />
          )}
        </section>
        <section className="min-h-0">
          {/* Keyed by document so a new upload starts a fresh conversation. */}
          <ChatPanel
            key={upload?.document.name ?? "none"}
            documentName={upload?.document.name ?? null}
            index={index}
            onSourceClick={showPage}
          />
        </section>
      </main>
    </div>
  );
}
