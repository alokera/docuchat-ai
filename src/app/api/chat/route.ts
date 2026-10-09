import { getLLMClient, LLM_MODEL } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/prompt";
import type { ChatMessage, ParsedDocument } from "@/lib/types";

// Allow long streamed answers on serverless platforms like Vercel.
export const maxDuration = 60;

// Only the most recent turns are sent, to keep prompts bounded.
const MAX_HISTORY = 10;

interface ChatRequestBody {
  document?: ParsedDocument;
  messages?: ChatMessage[];
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { document, messages } = body;
  if (!document?.pages?.length) {
    return Response.json({ error: "Upload a document first." }, { status: 400 });
  }
  if (!messages?.length || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  }

  const history = messages
    .slice(-MAX_HISTORY)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string");

  try {
    const stream = await getLLMClient().chat.completions.create({
      model: LLM_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [{ role: "system", content: buildSystemPrompt(document) }, ...history],
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
