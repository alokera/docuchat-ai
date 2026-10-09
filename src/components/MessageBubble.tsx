import type { ChatMessage } from "@/lib/types";

interface Props {
  message: ChatMessage;
  isPending?: boolean;
  onSourceClick?: (page: number) => void;
}

export function MessageBubble({ message, isPending, onSourceClick }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "rounded-bl-sm border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        }`}
      >
        {isPending ? <span className="animate-pulse text-neutral-400">Thinking…</span> : message.content}
      </div>

      {message.sources && message.sources.length > 0 && (
        <details className="mt-1.5 max-w-[85%] text-xs text-neutral-500">
          <summary className="cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-300">
            {message.sources.length} sources · pages {[...new Set(message.sources.map((s) => s.page))].sort((a, b) => a - b).join(", ")}
          </summary>
          <ul className="mt-2 space-y-2">
            {message.sources.map((source) => (
              <li key={source.id} className="rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSourceClick?.(source.page)}
                    className="font-semibold text-amber-600 hover:underline dark:text-amber-400"
                  >
                    Page {source.page}
                  </button>
                  <span title="Cosine similarity to your question">similarity {source.score.toFixed(2)}</span>
                </div>
                <p className="line-clamp-3">{source.text}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
