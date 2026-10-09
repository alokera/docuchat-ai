"use client";

import { useRef, useState } from "react";
import type { UploadResponse } from "@/lib/types";

interface Props {
  onUploaded: (result: UploadResponse) => void;
}

export function UploadDropzone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      onUploaded(data as UploadResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        disabled={isUploading}
        className={`flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${
          isDragging
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
            : "border-neutral-300 hover:border-amber-400 dark:border-neutral-700"
        } disabled:cursor-wait disabled:opacity-60`}
      >
        <span className="text-4xl" aria-hidden>
          📄
        </span>
        <span className="text-lg font-semibold">
          {isUploading ? "Reading your document…" : "Drop a document here"}
        </span>
        <span className="text-sm text-neutral-500">or click to browse · PDF, TXT, MD · up to 10 MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
