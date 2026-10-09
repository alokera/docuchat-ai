"use client";

import type { ParsedDocument } from "@/lib/types";

interface Props {
  document: ParsedDocument;
  truncated: boolean;
  onReset: () => void;
}

export function DocumentPanel({ document, truncated, onReset }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="min-w-0">
          <p className="truncate font-semibold" title={document.name}>
            {document.name}
          </p>
          <p className="text-xs text-neutral-500">
            {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
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

      {truncated && (
        <p className="bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          This document is long, so only the first part is sent to the AI. Retrieval (v0.2) will remove this limit.
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {document.pages.map((text, i) => (
          <section key={i} className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Page {i + 1}</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{text || <em>No text on this page.</em>}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
