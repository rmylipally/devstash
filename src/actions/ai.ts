"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { aiRateLimiters } from "@/lib/ai/rate-limit";
import { AI_MODEL, getOpenAIClient } from "@/lib/ai/openai";
import { getItemDetail, type DashboardItemKind } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";

const MAX_CONTENT_LENGTH = 2_000;
const MAX_SUGGESTED_TAGS = 5;

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
    kind: z
      .enum(["snippet", "prompt", "command", "note", "file", "image", "link"])
      .optional(),
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

type GenerateAutoTagsResult =
  | {
      data: string[];
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

function getUserFacingAiError(errorMessage: string) {
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
    return "AI tag suggestions are not configured yet. Add OPENAI_API_KEY and try again.";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("429")
  ) {
    return "AI service is temporarily busy. Please try again in a minute.";
  }

  if (normalizedMessage.includes("no valid tags")) {
    return "AI returned an unexpected format. Please try again.";
  }

  if (normalizedMessage.includes("database") || normalizedMessage.includes("prisma")) {
    return "Could not save AI suggestion metadata. Please try again.";
  }

  return "Could not generate tags right now. Please try again.";
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

function getProPlanError() {
  return "AI tag suggestions are available on the Pro plan.";
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
