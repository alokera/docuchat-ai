"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentPanel } from "@/components/DocumentPanel";
import { UploadDropzone } from "@/components/UploadDropzone";
import type { UploadResponse } from "@/lib/types";

export default function Home() {
  const [upload, setUpload] = useState<UploadResponse | null>(null);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 font-bold text-neutral-900">D</span>
        <h1 className="text-lg font-semibold">DocuChat AI</h1>
        <span className="ml-auto text-xs text-neutral-500">Powered by xAI Grok</span>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
        <section className="min-h-0 border-b border-neutral-200 md:border-b-0 md:border-r dark:border-neutral-800">
          {upload ? (
            <DocumentPanel document={upload.document} truncated={upload.truncated} onReset={() => setUpload(null)} />
          ) : (
            <UploadDropzone onUploaded={setUpload} />
          )}
        </section>
        <section className="min-h-0">
          {/* Keyed by document so a new upload starts a fresh conversation. */}
          <ChatPanel key={upload?.document.name ?? "none"} document={upload?.document ?? null} />
        </section>
      </main>
    </div>
  );
}
