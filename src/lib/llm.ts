import OpenAI from "openai";

// xAI's API is OpenAI-compatible, so we reuse the official SDK with a different base URL.
// Keeping the provider behind this module makes it easy to swap models/providers later.
let client: OpenAI | null = null;

export function getLLMClient(): OpenAI {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set. Copy .env.example to .env.local and add your key.");
  }
  client ??= new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
  return client;
}

export const LLM_MODEL = process.env.XAI_MODEL || "grok-4";
