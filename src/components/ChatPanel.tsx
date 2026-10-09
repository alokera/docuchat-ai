"use client";

import { useEffect, useRef, useState } from "react";
import { embed } from "@/lib/embedder";
import { buildRetrievalQuery, retrieve, type VectorIndex } from "@/lib/retrieval";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

// How many chunks are sent to the LLM per question.
const TOP_K = 5;

interface Props {
  documentName: string | null;
  /** Null while the document is still being embedded. */
  index: VectorIndex | null;
  onSourceClick: (page: number) => void;
}

export function ChatPanel({ documentName, index, onSourceClick }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canAsk = Boolean(documentName && index) && !isStreaming;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || !documentName || !index || isStreaming) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      // 1. Retrieve: embed the question and find the most similar chunks.
      const [queryVector] = await embed([buildRetrievalQuery(history)]);
      const sources = retrieve(index, queryVector, TOP_K);
      setMessages([...history, { role: "assistant", content: "", sources }]);

      // 2. Generate: send only those chunks to the LLM.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName,
          sources: sources.map(({ page, text }) => ({ page, text })),
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }

      // Append streamed text to the last (assistant) message as it arrives.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer, sources }]);
      }
    } catch (err) {
      setMessages(history);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsStreaming(false);
    }
  }

  let placeholder = "Ask a question about your document…";
  if (!documentName) placeholder = "Upload a document first";
  else if (!index) placeholder = "Indexing your document…";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {!documentName && <p className="mt-10 text-center text-neutral-500">Upload a document to start asking questions.</p>}
        {documentName && messages.length === 0 && (
          <MessageBubble
            message={{
              role: "assistant",
              content: index
                ? `Hi! I've indexed "${documentName}". Ask me anything about it. I'll find the most relevant passages and cite their pages.`
                : `Reading "${documentName}"… I'll be ready once indexing finishes.`,
            }}
          />
        )}
        {messages.map((message, i) => (
          <MessageBubble
            key={i}
            message={message}
            isPending={isStreaming && i === messages.length - 1 && !message.content}
            onSourceClick={onSourceClick}
          />
        ))}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={!canAsk}
          className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-amber-400 disabled:opacity-50 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={!canAsk || !input.trim()}
          className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-amber-300 disabled:opacity-40"
        >
          {isStreaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
