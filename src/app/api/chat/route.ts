import { getLLMClient, LLM_MODEL } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/prompt";
import type { ChatMessage, SourceExcerpt } from "@/lib/types";

// Allow long streamed answers on serverless platforms like Vercel.
export const maxDuration = 60;

// Only the most recent turns are sent, to keep prompts bounded.
const MAX_HISTORY = 10;
const MAX_SOURCES = 10;
const MAX_SOURCE_CHARS = 4000;

interface ChatRequestBody {
  documentName?: string;
  sources?: SourceExcerpt[];
  messages?: ChatMessage[];
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { documentName, sources, messages } = body;
  if (typeof documentName !== "string" || !Array.isArray(sources) || sources.length === 0) {
    return Response.json({ error: "Upload a document first." }, { status: 400 });
  }
  if (!messages?.length || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  }

  // The client chooses the excerpts, so bound what it can put into the prompt.
  const excerpts = sources
    .slice(0, MAX_SOURCES)
    .filter((s) => Number.isInteger(s.page) && typeof s.text === "string")
    .map((s) => ({ page: s.page, text: s.text.slice(0, MAX_SOURCE_CHARS) }));

  const history = messages
    .slice(-MAX_HISTORY)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(({ role, content }) => ({ role, content }));

  try {
    const stream = await getLLMClient().chat.completions.create({
      model: LLM_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [{ role: "system", content: buildSystemPrompt(documentName, excerpts) }, ...history],
    });

    // Re-emit only the text deltas as a plain-text stream the browser can read incrementally.
    const encoder = new TextEncoder();
    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(textStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (error) {
    console.error("LLM request failed:", error);
    const message = error instanceof Error ? error.message : "The AI service failed to respond.";
    return Response.json({ error: message }, { status: 502 });
  }
}
