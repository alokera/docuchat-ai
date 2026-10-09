"use client";

import type { EmbedProgress } from "@/lib/embedder";
import type { ParsedDocument } from "@/lib/types";

export type IndexStatus =
  | { state: "idle" }
  | { state: "indexing"; progress: EmbedProgress | null }
  | { state: "ready" }
  | { state: "error"; message: string };

interface Props {
  document: ParsedDocument;
  chunkCount: number;
  truncated: boolean;
  indexStatus: IndexStatus;
  highlightedPage: number | null;
  onReset: () => void;
}

export function DocumentPanel({ document, chunkCount, truncated, indexStatus, highlightedPage, onReset }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="min-w-0">
          <p className="truncate font-semibold" title={document.name}>
            {document.name}
          </p>
          <p className="text-xs text-neutral-500">
            {document.pageCount} {document.pageCount === 1 ? "page" : "pages"} · {chunkCount} chunks
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          New document
        </button>
      </div>

      <IndexStatusBar status={indexStatus} />

      {truncated && (
        <p className="bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          This document is very long, so only the first {chunkCount} chunks are searchable.
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {document.pages.map((text, i) => (
          <section
            key={i}
            id={`page-${i + 1}`}
            className={`scroll-mt-4 rounded-xl bg-neutral-50 p-4 transition dark:bg-neutral-900 ${
              highlightedPage === i + 1 ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Page {i + 1}</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{text || <em>No text on this page.</em>}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function IndexStatusBar({ status }: { status: IndexStatus }) {
  if (status.state === "idle" || status.state === "ready") return null;
  if (status.state === "error") {
    return <p className="bg-red-50 px-4 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">Indexing failed: {status.message}</p>;
  }

  const { progress } = status;
  let label = "Preparing…";
  let percent = 0;
  if (progress?.stage === "loading-model") {
    label = `Downloading embedding model (first time only)… ${progress.percent}%`;
    percent = progress.percent;
  } else if (progress?.stage === "embedding") {
    label = `Embedding chunks… ${progress.done}/${progress.total}`;
    percent = Math.round((progress.done / progress.total) * 100);
  }

  return (
    <div className="border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <p className="mb-1 text-xs text-neutral-500">{label}</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
