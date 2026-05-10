"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { aiRateLimiters } from "@/lib/ai/rate-limit";
import { AI_MODEL, getOpenAIClient } from "@/lib/ai/openai";
import { getItemDetail, type DashboardItemKind } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";

const MAX_CONTENT_LENGTH = 2_000;
const MAX_DESCRIPTION_LENGTH = 320;
const MAX_EXPLANATION_WORDS = 300;
const MAX_SUGGESTED_TAGS = 5;
const itemKindSchema = z.enum([
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
]);

const optionalStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue ? trimmedValue : null;
  });

const autoTagRequestSchema = z
  .object({
    content: optionalStringSchema,
    description: optionalStringSchema,
    itemId: optionalStringSchema,
    kind: itemKindSchema.optional(),
    language: optionalStringSchema,
    title: optionalStringSchema,
    url: optionalStringSchema,
  })
  .superRefine((value, context) => {
    if (!value.itemId && !value.title) {
      context.addIssue({
        code: "custom",
        message: "A title is required to generate tags.",
        path: ["title"],
      });
    }
  });

const autoDescriptionRequestSchema = z
  .object({
    content: optionalStringSchema,
    description: optionalStringSchema,
    kind: itemKindSchema.optional(),
    language: optionalStringSchema,
    mimeType: optionalStringSchema,
    originalFileName: optionalStringSchema,
    title: optionalStringSchema,
    url: optionalStringSchema,
  })
  .superRefine((value, context) => {
    const hasInput = Boolean(
      value.title ||
      value.content ||
      value.url ||
      value.originalFileName ||
      value.mimeType,
    );

    if (!hasInput) {
      context.addIssue({
        code: "custom",
        message: "Provide at least a title, content, URL, or file metadata to generate a description.",
        path: ["title"],
      });
    }
  });

const explainCodeRequestSchema = z
  .object({
    content: optionalStringSchema,
    description: optionalStringSchema,
    itemId: optionalStringSchema,
    kind: itemKindSchema.optional(),
    language: optionalStringSchema,
    title: optionalStringSchema,
    url: optionalStringSchema,
  })
  .superRefine((value, context) => {
    if (value.kind && !isExplainableKind(value.kind)) {
      context.addIssue({
        code: "custom",
        message: "Code explanation is available only for snippets and commands.",
        path: ["kind"],
      });
    }

    if (!value.itemId && !value.content) {
      context.addIssue({
        code: "custom",
        message: "Code content is required to generate an explanation.",
        path: ["content"],
      });
    }
  });

type GenerateAutoTagsResult =
  | {
      data: string[];
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type GenerateAutoDescriptionResult =
  | {
      data: string;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type ExplainCodeResult =
  | {
      data: string;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

interface TagSource {
  content: string | null;
  description: string | null;
  itemId: string | null;
  kind: DashboardItemKind | null;
  language: string | null;
  title: string;
  url: string | null;
}

interface DescriptionSource {
  content: string | null;
  currentDescription: string | null;
  kind: DashboardItemKind | null;
  language: string | null;
  mimeType: string | null;
  originalFileName: string | null;
  title: string | null;
  url: string | null;
}

interface ExplainCodeSource {
  content: string;
  description: string | null;
  itemId: string | null;
  kind: "command" | "snippet";
  language: string | null;
  title: string | null;
  url: string | null;
}

function isExplainableKind(kind: DashboardItemKind) {
  return kind === "snippet" || kind === "command";
}

function getValidationError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

function truncateContent(content: string | null) {
  if (!content) {
    return null;
  }

  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }

  return content.slice(0, MAX_CONTENT_LENGTH);
}

function toNormalizedTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const uniqueTags = new Set<string>();

  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }

    const normalizedTag = tag.trim().toLowerCase();

    if (!normalizedTag) {
      continue;
    }

    uniqueTags.add(normalizedTag);

    if (uniqueTags.size >= MAX_SUGGESTED_TAGS) {
      break;
    }
  }

  return Array.from(uniqueTags);
}

function parseTagsFromResponse(rawOutputText: string): string[] {
  const normalizedText = rawOutputText.trim();

  if (!normalizedText) {
    return [];
  }

  const fencedJsonMatch = normalizedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidateText = fencedJsonMatch?.[1]?.trim() || normalizedText;

  try {
    const parsed = JSON.parse(candidateText) as unknown;

    if (Array.isArray(parsed)) {
      return toNormalizedTags(parsed);
    }

    if (parsed && typeof parsed === "object" && "tags" in parsed) {
      return toNormalizedTags((parsed as { tags?: unknown }).tags);
    }
  } catch {
    // Fall through to permissive plain-text parsing.
  }

  const lineTags = candidateText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);

  return toNormalizedTags(lineTags.length > 0 ? lineTags : candidateText.split(","));
}

function getResponseOutputText(response: {
  output?: Array<{
    content?: Array<{ text?: string; type?: string }>;
    type?: string;
  }>;
  output_text?: string;
}) {
  const outputText = response.output_text?.trim();

  if (outputText) {
    return outputText;
  }

  if (!Array.isArray(response.output)) {
    return "";
  }

  const chunks: string[] = [];

  for (const outputItem of response.output) {
    if (!Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        (contentItem.type === "output_text" || contentItem.type === "text") &&
        typeof contentItem.text === "string"
      ) {
        chunks.push(contentItem.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function getUserFacingAiError(
  errorMessage: string,
  {
    configMessage = "AI tag suggestions are not configured yet. Add OPENAI_API_KEY and try again.",
    unexpectedFormatMessage = "AI returned an unexpected format. Please try again.",
  }: {
    configMessage?: string;
    unexpectedFormatMessage?: string;
  } = {},
) {
  const normalizedMessage = errorMessage.toLowerCase();

  if (
    normalizedMessage.includes("exceeded your current quota") ||
    normalizedMessage.includes("insufficient_quota") ||
    normalizedMessage.includes("plan and billing")
  ) {
    return "AI quota has been exceeded for this OpenAI account. Check billing and usage limits, then try again.";
  }

  if (
    normalizedMessage.includes("openai_api_key") ||
    normalizedMessage.includes("missing credentials")
  ) {
    return configMessage;
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("429")
  ) {
    return "AI service is temporarily busy. Please try again in a minute.";
  }

  if (
    normalizedMessage.includes("no valid tags") ||
    normalizedMessage.includes("no valid description")
  ) {
    return unexpectedFormatMessage;
  }

  if (normalizedMessage.includes("database") || normalizedMessage.includes("prisma")) {
    return "Could not save AI suggestion metadata. Please try again.";
  }

  return "Could not generate tags right now. Please try again.";
}

function parseDescriptionFromResponse(rawOutputText: string) {
  const normalizedText = rawOutputText.trim();

  if (!normalizedText) {
    return "";
  }

  const fencedJsonMatch = normalizedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidateText = fencedJsonMatch?.[1]?.trim() || normalizedText;

  try {
    const parsed = JSON.parse(candidateText) as unknown;

    if (typeof parsed === "string") {
      return parsed.trim();
    }

    if (parsed && typeof parsed === "object" && "description" in parsed) {
      const description = (parsed as { description?: unknown }).description;

      if (typeof description === "string") {
        return description.trim();
      }
    }
  } catch {
    // Fall through to plain text handling.
  }

  return candidateText;
}

function parseExplanationFromResponse(rawOutputText: string) {
  const normalizedText = rawOutputText.trim();

  if (!normalizedText) {
    return "";
  }

  const fencedJsonMatch = normalizedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidateText = fencedJsonMatch?.[1]?.trim() || normalizedText;

  try {
    const parsed = JSON.parse(candidateText) as unknown;

    if (typeof parsed === "string") {
      return parsed.trim();
    }

    if (parsed && typeof parsed === "object") {
      const explanation = (parsed as { explanation?: unknown }).explanation;

      if (typeof explanation === "string") {
        return explanation.trim();
      }
    }
  } catch {
    // Fall through to plain text handling.
  }

  return candidateText;
}

function getPromptInput(source: TagSource) {
  const safeContent = truncateContent(source.content);

  const promptParts = [
    "Respond with valid json only.",
    "Return a json object with a tags array, like {\"tags\":[\"tag\"]}.",
    `Item kind: ${source.kind ?? "unknown"}`,
    `Title: ${source.title}`,
    `Description: ${source.description ?? "(none)"}`,
    `Language: ${source.language ?? "(none)"}`,
    `URL: ${source.url ?? "(none)"}`,
    `Content (max ${MAX_CONTENT_LENGTH} chars):\n${safeContent ?? "(none)"}`,
  ];

  return promptParts.join("\n\n");
}

function getDescriptionPromptInput(source: DescriptionSource) {
  const safeContent = truncateContent(source.content);

  const promptParts = [
    "Respond with valid json only.",
    "Return a json object with one key: description.",
    "Write a concise, useful 1-2 sentence description for this developer item.",
    `Item kind: ${source.kind ?? "unknown"}`,
    `Title: ${source.title ?? "(none)"}`,
    `Current description: ${source.currentDescription ?? "(none)"}`,
    `Language: ${source.language ?? "(none)"}`,
    `URL: ${source.url ?? "(none)"}`,
    `Original file name: ${source.originalFileName ?? "(none)"}`,
    `MIME type: ${source.mimeType ?? "(none)"}`,
    `Content (max ${MAX_CONTENT_LENGTH} chars):\n${safeContent ?? "(none)"}`,
  ];

  return promptParts.join("\n\n");
}

function getExplainCodePromptInput(source: ExplainCodeSource) {
  const safeContent = truncateContent(source.content);

  const promptParts = [
    "Respond with valid json only.",
    "Return a json object with one key: explanation.",
    "Explain what this code/command does, what key concepts matter, and any notable behavior or risks.",
    "Keep the explanation concise: around 200-300 words.",
    `Item kind: ${source.kind}`,
    `Title: ${source.title ?? "(none)"}`,
    `Description: ${source.description ?? "(none)"}`,
    `Language: ${source.language ?? "(none)"}`,
    `URL: ${source.url ?? "(none)"}`,
    `Code or command content (max ${MAX_CONTENT_LENGTH} chars):\n${safeContent ?? "(none)"}`,
  ];

  return promptParts.join("\n\n");
}

function toTwoSentenceDescription(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();

  if (!normalizedValue) {
    return "";
  }

  const sentences = normalizedValue
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const description = sentences.length > 0
    ? sentences.slice(0, 2).join(" ")
    : normalizedValue;

  return description.length > MAX_DESCRIPTION_LENGTH
    ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
    : description;
}

function getProPlanError() {
  return "AI tag suggestions are available on the Pro plan.";
}

function getProPlanDescriptionError() {
  return "AI description generation is available on the Pro plan.";
}

function getProPlanExplainError() {
  return "AI code explanation is available on the Pro plan.";
}

function normalizeExplanation(value: string) {
  const normalizedValue = value.replace(/\s+/g, " ").trim();

  if (!normalizedValue) {
    return "";
  }

  const words = normalizedValue.split(" ").filter(Boolean);

  if (words.length <= MAX_EXPLANATION_WORDS) {
    return normalizedValue;
  }

  return `${words.slice(0, MAX_EXPLANATION_WORDS).join(" ")}…`;
}

export async function generateAutoTags(
  input: unknown,
): Promise<GenerateAutoTagsResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to generate tags.",
    };
  }

  if (session.user.plan !== "pro") {
    return {
      success: false,
      error: getProPlanError(),
    };
  }

  const rateLimitKey = buildRateLimitKey(aiRateLimiters.autoTag.prefix, [userId]);
  const rateLimitResult = await checkRateLimit({
    key: rateLimitKey,
    limiter: aiRateLimiters.autoTag.limiter,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: "AI tag limit reached. Try again in about an hour.",
    };
  }

  const parsedInput = autoTagRequestSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: getValidationError(parsedInput.error),
    };
  }

  let source: TagSource;

  if (parsedInput.data.itemId) {
    const item = await getItemDetail({
      itemId: parsedInput.data.itemId,
      userId,
    });

    if (!item) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    source = {
      content: item.content,
      description: item.description,
      itemId: item.id,
      kind: item.kind,
      language: item.language,
      title: item.title,
      url: item.sourceUrl,
    };
  } else {
    const title = parsedInput.data.title ?? "";

    if (!title.trim()) {
      return {
        success: false,
        error: "A title is required to generate tags.",
      };
    }

    source = {
      content: parsedInput.data.content,
      description: parsedInput.data.description,
      itemId: null,
      kind: parsedInput.data.kind ?? null,
      language: parsedInput.data.language,
      title,
      url: parsedInput.data.url,
    };
  }

  let aiJobId: string | null = null;

  try {
    if (source.itemId) {
      const aiJob = await prisma.aiJob.create({
        data: {
          itemId: source.itemId,
          model: AI_MODEL,
          startedAt: new Date(),
          status: "RUNNING",
          type: "AUTO_TAG",
          userId,
        },
        select: {
          id: true,
        },
      });

      aiJobId = aiJob.id;
    }

    const openAI = getOpenAIClient();
    const response = await openAI.responses.create({
      input: getPromptInput(source),
      instructions:
        "Generate 3 to 5 concise, reusable developer tags. Return json only as {\"tags\":[\"tag\"]}. Do not include markdown fences or explanations.",
      model: AI_MODEL,
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const tags = parseTagsFromResponse(
      getResponseOutputText(response as { output?: Array<{ content?: Array<{ text?: string; type?: string }>; type?: string }>; output_text?: string }),
    );

    if (tags.length === 0) {
      throw new Error("No valid tags were returned by the AI service.");
    }

    if (aiJobId) {
      await prisma.aiJob.update({
        data: {
          completedAt: new Date(),
          result: {
            tags,
          },
          status: "SUCCEEDED",
        },
        where: {
          id: aiJobId,
        },
      });
    }

    return {
      success: true,
      data: tags,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Could not generate tags right now.";
    const userFacingError = getUserFacingAiError(errorMessage);

    if (aiJobId) {
      await prisma.aiJob.update({
        data: {
          completedAt: new Date(),
          error: errorMessage,
          status: "FAILED",
        },
        where: {
          id: aiJobId,
        },
      }).catch(() => null);
    }

    console.error("generateAutoTags failed", {
      error: errorMessage,
      itemId: source.itemId,
      userId,
    });

    return {
      success: false,
      error: userFacingError,
    };
  }
}

export async function generateAutoDescription(
  input: unknown,
): Promise<GenerateAutoDescriptionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to generate descriptions.",
    };
  }

  if (session.user.plan !== "pro") {
    return {
      success: false,
      error: getProPlanDescriptionError(),
    };
  }

  const rateLimitKey = buildRateLimitKey(aiRateLimiters.autoDescription.prefix, [userId]);
  const rateLimitResult = await checkRateLimit({
    key: rateLimitKey,
    limiter: aiRateLimiters.autoDescription.limiter,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: "AI description limit reached. Try again in about an hour.",
    };
  }

  const parsedInput = autoDescriptionRequestSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: getValidationError(parsedInput.error),
    };
  }

  const source: DescriptionSource = {
    content: parsedInput.data.content,
    currentDescription: parsedInput.data.description,
    kind: parsedInput.data.kind ?? null,
    language: parsedInput.data.language,
    mimeType: parsedInput.data.mimeType,
    originalFileName: parsedInput.data.originalFileName,
    title: parsedInput.data.title,
    url: parsedInput.data.url,
  };

  try {
    const openAI = getOpenAIClient();
    const response = await openAI.responses.create({
      input: getDescriptionPromptInput(source),
      instructions:
        "Generate a high-quality developer-facing summary. Return json only as {\"description\":\"text\"}. Keep it to 1-2 sentences and avoid markdown.",
      model: AI_MODEL,
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const responseText = getResponseOutputText(response as {
      output?: Array<{
        content?: Array<{ text?: string; type?: string }>;
        type?: string;
      }>;
      output_text?: string;
    });
    const rawDescription = parseDescriptionFromResponse(responseText);
    const description = toTwoSentenceDescription(rawDescription);

    if (!description) {
      throw new Error("No valid description was returned by the AI service.");
    }

    return {
      success: true,
      data: description,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Could not generate description right now.";
    const userFacingError = getUserFacingAiError(errorMessage, {
      configMessage:
        "AI description generation is not configured yet. Add OPENAI_API_KEY and try again.",
      unexpectedFormatMessage:
        "AI returned an unexpected description format. Please try again.",
    });

    console.error("generateAutoDescription failed", {
      error: errorMessage,
      userId,
    });

    return {
      success: false,
      error:
        userFacingError === "Could not generate tags right now. Please try again."
          ? "Could not generate description right now. Please try again."
          : userFacingError,
    };
  }
}

export async function explainCode(
  input: unknown,
): Promise<ExplainCodeResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to explain code.",
    };
  }

  if (session.user.plan !== "pro") {
    return {
      success: false,
      error: getProPlanExplainError(),
    };
  }

  const rateLimitKey = buildRateLimitKey(aiRateLimiters.explainCode.prefix, [userId]);
  const rateLimitResult = await checkRateLimit({
    key: rateLimitKey,
    limiter: aiRateLimiters.explainCode.limiter,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: "AI explanation limit reached. Try again in about an hour.",
    };
  }

  const parsedInput = explainCodeRequestSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error: getValidationError(parsedInput.error),
    };
  }

  let source: ExplainCodeSource;

  if (parsedInput.data.itemId) {
    const item = await getItemDetail({
      itemId: parsedInput.data.itemId,
      userId,
    });

    if (!item) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    if (!isExplainableKind(item.kind)) {
      return {
        success: false,
        error: "Code explanation is available only for snippets and commands.",
      };
    }

    if (!item.content?.trim()) {
      return {
        success: false,
        error: "Code content is required to generate an explanation.",
      };
    }

    source = {
      content: item.content,
      description: item.description,
      itemId: item.id,
      kind: item.kind,
      language: item.language,
      title: item.title,
      url: item.sourceUrl,
    };
  } else {
    const kind = parsedInput.data.kind;

    if (!kind || !isExplainableKind(kind)) {
      return {
        success: false,
        error: "Code explanation is available only for snippets and commands.",
      };
    }

    const content = parsedInput.data.content;

    if (!content?.trim()) {
      return {
        success: false,
        error: "Code content is required to generate an explanation.",
      };
    }

    source = {
      content,
      description: parsedInput.data.description,
      itemId: null,
      kind,
      language: parsedInput.data.language,
      title: parsedInput.data.title,
      url: parsedInput.data.url,
    };
  }

  let aiJobId: string | null = null;

  try {
    if (source.itemId) {
      const aiJob = await prisma.aiJob.create({
        data: {
          itemId: source.itemId,
          model: AI_MODEL,
          startedAt: new Date(),
          status: "RUNNING",
          type: "EXPLAIN_CODE",
          userId,
        },
        select: {
          id: true,
        },
      });

      aiJobId = aiJob.id;
    }

    const openAI = getOpenAIClient();
    const response = await openAI.responses.create({
      input: getExplainCodePromptInput(source),
      instructions:
        "Generate a concise developer-facing explanation. Return json only as {\"explanation\":\"text\"}. Keep it around 200-300 words and avoid markdown code fences.",
      model: AI_MODEL,
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const responseText = getResponseOutputText(response as {
      output?: Array<{
        content?: Array<{ text?: string; type?: string }>;
        type?: string;
      }>;
      output_text?: string;
    });
    const rawExplanation = parseExplanationFromResponse(responseText);
    const explanation = normalizeExplanation(rawExplanation);

    if (!explanation) {
      throw new Error("No valid explanation was returned by the AI service.");
    }

    if (aiJobId) {
      await prisma.aiJob.update({
        data: {
          completedAt: new Date(),
          result: {
            explanation,
          },
          status: "SUCCEEDED",
        },
        where: {
          id: aiJobId,
        },
      });
    }

    return {
      success: true,
      data: explanation,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Could not generate explanation right now.";
    const userFacingError = getUserFacingAiError(errorMessage, {
      configMessage:
        "AI code explanation is not configured yet. Add OPENAI_API_KEY and try again.",
      unexpectedFormatMessage:
        "AI returned an unexpected explanation format. Please try again.",
    });

    if (aiJobId) {
      await prisma.aiJob.update({
        data: {
          completedAt: new Date(),
          error: errorMessage,
          status: "FAILED",
        },
        where: {
          id: aiJobId,
        },
      }).catch(() => null);
    }

    console.error("explainCode failed", {
      error: errorMessage,
      itemId: source.itemId,
      userId,
    });

    return {
      success: false,
      error:
        userFacingError === "Could not generate tags right now. Please try again."
          ? "Could not generate explanation right now. Please try again."
          : userFacingError,
    };
  }
}
