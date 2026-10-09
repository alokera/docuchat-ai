import type { ChatMessage } from "@/lib/types";

interface Props {
  message: ChatMessage;
  isPending?: boolean;
}

export function MessageBubble({ message, isPending }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "rounded-bl-sm border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        }`}
      >
        {isPending ? <span className="animate-pulse text-neutral-400">Thinking…</span> : message.content}
      </div>
    </div>
  );
}
