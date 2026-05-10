import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

let openAiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (openAiClient) {
    return openAiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to use AI features.");
  }

  openAiClient = new OpenAI({
    apiKey,
  });

  return openAiClient;
}
