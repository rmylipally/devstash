# AI Integration Plan for DevStash

## Overview

This document outlines best practices for integrating OpenAI's `gpt-5.4-nano` model into DevStash for AI-powered features: auto-tagging, summaries, code explanation, and prompt optimization. The plan adheres to existing DevStash patterns: server actions, Pro gating, error handling, and security.

---

## 1. OpenAI SDK Setup and Configuration

### 1.1 Installation

Add the OpenAI SDK to `package.json`:

```bash
npm install openai
```

Or via yarn:

```bash
yarn add openai
```

### 1.2 Environment Variables

Create `.env.local` entries (add to `.env.example` as well):

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-nano
OPENAI_ORG_ID=org-...  # Optional, if using organization
```

**Security:**
- Store `OPENAI_API_KEY` in environment only (never commit).
- Use a rate-limited API key for development.
- Rotate keys regularly in production.
- Consider separate keys for different environments.

### 1.3 Client Initialization

Create `src/lib/ai/openai.ts` to centralize SDK setup:

```typescript
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

export const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-nano";
```

**Notes:**
- Initialize once and reuse (SDK handles connection pooling).
- Throw early if API key is missing (fail fast in development).
- Consider adding a version constant for auditing.

---

## 2. Server Action Patterns

### 2.1 Existing DevStash Pattern

DevStash already uses server actions for user-initiated operations:

**Example from `src/actions/items.ts`:**

```typescript
"use server";

export async function createItem(input: ItemCreateInput): Promise<CreateItemActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate and check limits
  // Perform operation
  // Return { success, data } or { success, error }
}
```

### 2.2 AI Action Pattern

Follow the same pattern for AI operations in `src/actions/ai.ts`:

```typescript
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { openai, MODEL } from "@/lib/ai/openai";
import { prisma } from "@/lib/prisma";
import { isProPlan } from "@/lib/billing";

type AiActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Auto-tag an item based on its title, description, and content.
 */
export async function autoTagItem(
  itemId: string,
): Promise<AiActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  // Gate for Pro users
  if (!isProPlan(session.user.plan)) {
    return { success: false, error: "AI features require Pro plan" };
  }

  try {
    // Fetch item
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { title: true, description: true, content: true, userId: true },
    });

    if (!item || item.userId !== session.user.id) {
      return { success: false, error: "Item not found" };
    }

    // Create AI job record
    const aiJob = await prisma.aiJob.create({
      data: {
        type: "AUTO_TAG",
        status: "RUNNING",
        model: MODEL,
        userId: session.user.id,
        itemId,
      },
    });

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates concise tags for content.",
        },
        {
          role: "user",
          content: `Generate 5 relevant tags for this content:\n\nTitle: ${item.title}\n\nDescription: ${item.description}\n\nContent: ${item.content?.substring(0, 500)}...`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const tags = parseTagsFromResponse(response.choices[0]?.message?.content || "");

    // Update AI job
    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: "SUCCEEDED",
        result: { tags },
        completedAt: new Date(),
      },
    });

    return { success: true, data: tags };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown AI error";

    // Log error to AiJob
    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: "FAILED",
        error: errorMessage,
        completedAt: new Date(),
      },
    }).catch(() => {}); // Ignore DB errors in error path

    console.error("Auto-tag error:", error);
    return { success: false, error: errorMessage };
  }
}
```

**Key Principles:**
- Always verify authentication first.
- Gate AI features for Pro users via `isProPlan()`.
- Create an `AiJob` record to track the operation.
- Use consistent error response structure: `{ success, data? | error? }`.
- Update `AiJob` status (PENDING → RUNNING → SUCCEEDED/FAILED).
- Log errors to both console and `AiJob.error`.

---

## 3. Streaming vs Non-Streaming Responses

### 3.1 Non-Streaming (Simple Operations)

**Use for:**
- Auto-tagging (quick, deterministic)
- Summaries (usually complete quickly)
- Structured outputs (JSON responses)

**Example (above):** Basic `chat.completions.create()`.

**Pros:**
- Simpler code.
- Full response available when done.
- Easier to store in database.

**Cons:**
- User waits for full response before seeing anything.
- Longer perceived latency.

### 3.2 Streaming (Long Operations)

**Use for:**
- Code explanation (potentially long explanations)
- Prompt optimization (multi-turn iterative refinement)

**Example with streaming:**

```typescript
export async function explainCode(
  codeContent: string,
  language: string,
): Promise<AiActionResult<AsyncIterable<string>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (!isProPlan(session.user.plan)) {
    return { success: false, error: "AI features require Pro plan" };
  }

  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Explain this code clearly, line by line.",
        },
        {
          role: "user",
          content: `Explain this ${language} code:\n\n${codeContent}`,
        },
      ],
      stream: true,
      temperature: 0.7,
    });

    return { success: true, data: streamToAsyncIterable(stream) };
  } catch (error) {
    console.error("Explain code error:", error);
    return { success: false, error: "Failed to explain code" };
  }
}

// Helper to convert stream to async iterable
async function* streamToAsyncIterable(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncIterable<string> {
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || "";
  }
}
```

**Client-side handling (in a client component):**

```typescript
"use client";

export async function ExplainCodeButton({ codeContent, language }) {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleExplain() {
    setIsLoading(true);
    setExplanation("");

    try {
      const result = await explainCode(codeContent, language);
      if (!result.success) {
        setExplanation(`Error: ${result.error}`);
        return;
      }

      for await (const chunk of result.data) {
        setExplanation((prev) => prev + chunk);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button onClick={handleExplain} disabled={isLoading}>
        {isLoading ? "Explaining..." : "Explain Code"}
      </button>
      <div className="whitespace-pre-wrap">{explanation}</div>
    </>
  );
}
```

---

## 4. Error Handling and Rate Limiting

### 4.1 OpenAI SDK Errors

The OpenAI SDK throws typed errors:

```typescript
import { APIError, RateLimitError } from "openai";

try {
  const response = await openai.chat.completions.create({ /* ... */ });
} catch (error) {
  if (error instanceof RateLimitError) {
    // 429: Too Many Requests
    return { success: false, error: "Rate limited. Please try again later." };
  }
  if (error instanceof APIError) {
    // 401, 403, 500, etc.
    console.error(`OpenAI API error (${error.status}):`, error.message);
    return { success: false, error: "AI service error. Try again later." };
  }
  throw error;
}
```

### 4.2 Application-Level Rate Limiting

Use Upstash (already in dependencies) for per-user rate limits:

```typescript
// src/lib/ai/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 10 AI requests per minute per user
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ai:",
});

// In server action:
const { success: rateLimitOk } = await aiRateLimit.limit(session.user.id);
if (!rateLimitOk) {
  return { success: false, error: "Too many AI requests. Wait a minute." };
}
```

### 4.3 Retry Logic

OpenAI SDK has built-in retry with exponential backoff (default: 3 retries). To customize:

```typescript
const openaiWithRetry = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30 * 1000, // 30 seconds
});
```

---

## 5. Pro User Gating Patterns

### 5.1 Existing Pattern in DevStash

From `src/lib/usage-limits.ts`:

```typescript
export function isProRequiredItemKind(kind: string): boolean {
  return kind === "file" || kind === "image";
}

export function getItemKindPlanAccessResult({
  kind,
  plan,
}: {
  kind: string;
  plan: SessionPlan | PlanTier | null | undefined;
}): { allowed: boolean; reason?: string } {
  if (!isProRequiredItemKind(kind)) {
    return { allowed: true };
  }

  if (isProPlan(plan)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "File and image items are available on Pro. Upgrade to continue.",
  };
}
```

### 5.2 Extend for AI Features

In `src/lib/usage-limits.ts`, add:

```typescript
export const AI_FEATURES_PRO_REQUIRED = true; // Gating constant

export function getAiFeatureAccessResult(
  plan: SessionPlan | PlanTier | null | undefined,
): { allowed: boolean; reason?: string } {
  if (isProPlan(plan)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "AI features require Pro. Upgrade to unlock auto-tagging, summaries, and more.",
  };
}
```

Use in server actions:

```typescript
const access = getAiFeatureAccessResult(session.user.plan);
if (!access.allowed) {
  return { success: false, error: access.reason };
}
```

---

## 6. Cost Optimization Strategies

### 6.1 Model Selection

- **`gpt-5.4-nano`**: Cheapest, fastest, suitable for tagging and summaries.
- **Fallback**: Consider a cheaper model for frequent operations if costs grow.

### 6.2 Request Optimization

```typescript
// Limit context window
messages: [
  { role: "user", content: contentTruncate(item.content, 1000) }
],
max_tokens: 150, // Only request what you need

// Batch operations
// Instead of one request per tag, batch items in a single request if feasible
```

### 6.3 Caching

Consider caching results to avoid repeated calls:

```typescript
// Simple in-memory cache (for high-volume scenarios, use Redis)
const summaryCache = new Map<string, { text: string; timestamp: number }>();

export async function summarizeItem(itemId: string) {
  const cached = summaryCache.get(itemId);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) {
    return { success: true, data: cached.text };
  }

  // ... fetch from API ...

  summaryCache.set(itemId, { text: result, timestamp: Date.now() });
  return { success: true, data: result };
}
```

### 6.4 Async Job Queue

For non-urgent operations, defer to a background job:

```typescript
// Create AiJob with PENDING status
await prisma.aiJob.create({
  data: {
    type: "AUTO_TAG",
    status: "PENDING",
    itemId,
    userId: session.user.id,
    model: MODEL,
  },
});

// Trigger async processor (e.g., cron job, queue service, webhook)
// Processor fetches PENDING jobs and runs them

// UI polls job status or uses WebSocket for updates
```

---

## 7. UI Patterns for AI Features

### 7.1 Accept/Reject Suggestions

**Component pattern:**

```typescript
interface SuggestionState {
  tags: string[];
  isLoading: boolean;
  error: string | null;
  isAccepted: boolean;
}

export function AutoTagSuggestion({ itemId }: { itemId: string }) {
  const [state, setState] = useState<SuggestionState>({
    tags: [],
    isLoading: false,
    error: null,
    isAccepted: false,
  });

  async function generateTags() {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await autoTagItem(itemId);
    if (result.success) {
      setState((prev) => ({
        ...prev,
        tags: result.data,
        isLoading: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error,
        isLoading: false,
      }));
    }
  }

  async function acceptTags() {
    // Apply tags to item
    setState((prev) => ({ ...prev, isAccepted: true }));
  }

  return (
    <div className="border rounded p-4">
      <h3>AI-Generated Tags</h3>
      {state.isLoading && <Spinner />}
      {state.error && <p className="text-red-500">{state.error}</p>}
      {state.tags.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {state.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={acceptTags}>Accept</Button>
            <Button variant="outline" onClick={generateTags}>
              Regenerate
            </Button>
          </div>
        </>
      )}
      {!state.isLoading && state.tags.length === 0 && (
        <Button onClick={generateTags}>Generate Tags</Button>
      )}
    </div>
  );
}
```

### 7.2 Loading States

```typescript
// Show skeleton while fetching
<Skeleton className="h-4 w-3/4" />

// Or streaming indicator
<div className="flex gap-1">
  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-200" />
  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-400" />
</div>
```

### 7.3 Pro Upgrade Upsell

```typescript
if (!isProPlan(session.user.plan)) {
  return (
    <div className="border border-blue-200 bg-blue-50 rounded p-4">
      <p>AI features unlock with Pro.</p>
      <Button variant="link">
        <Link href="/upgrade">Upgrade now</Link>
      </Button>
    </div>
  );
}
```

---

## 8. Security Considerations

### 8.1 API Key Handling

- **Never expose API key in client-side code.**
- **Server actions only**: All AI calls must be `"use server"` functions.
- **Environment variables**: Store keys in `.env.local` (not in version control).
- **Rotation**: Rotate keys regularly in production.

### 8.2 Input Sanitization

```typescript
import { z } from "zod";

const sanitizeInput = z.string().trim().max(10000);

export async function explainCode(code: string) {
  const sanitized = sanitizeInput.parse(code);
  // Use sanitized input
}
```

### 8.3 User Ownership Verification

```typescript
// Always verify the user owns the resource
const item = await prisma.item.findFirst({
  where: {
    id: itemId,
    userId: session.user.id, // Essential!
  },
});

if (!item) {
  return { success: false, error: "Not found" };
}
```

### 8.4 Audit Logging

Store all AI operations in `AiJob`:

```typescript
const aiJob = await prisma.aiJob.create({
  data: {
    type: "AUTO_TAG",
    status: "PENDING",
    model: MODEL,
    userId: session.user.id,
    itemId,
    promptVersion: PROMPT_VERSION, // Version for future auditing
  },
});
```

This allows you to:
- Track which AI operations ran for each user.
- Audit prompts and results for compliance.
- Retrace cost for billing.

---

## 9. Implementation Checklist

- [ ] Add `openai` to `package.json` and run `npm install`.
- [ ] Create `src/lib/ai/openai.ts` with SDK initialization.
- [ ] Add `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_ORG_ID` to `.env.example` and `.env.local`.
- [ ] Extend `src/lib/usage-limits.ts` with `getAiFeatureAccessResult()`.
- [ ] Create `src/lib/ai/rate-limit.ts` with Upstash rate limiting.
- [ ] Create `src/actions/ai.ts` with server actions (`autoTagItem`, `summarizeItem`, `explainCode`, `optimizePrompt`).
- [ ] Add `AiJob` tracking in each action (already modeled in schema).
- [ ] Create UI components for AI features (suggestion cards, loading states, upsell).
- [ ] Write tests for server actions and error handling.
- [ ] Document new environment variables in `README.md`.
- [ ] Set up monitoring/logging for AI costs and errors.

---

## 10. Example: Complete Auto-Tag Flow

### 10.1 Server Action (`src/actions/ai.ts`)

```typescript
"use server";

import { auth } from "@/auth";
import { openai, MODEL } from "@/lib/ai/openai";
import { prisma } from "@/lib/prisma";
import { isProPlan } from "@/lib/billing";
import { aiRateLimit } from "@/lib/ai/rate-limit";

export async function autoTagItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (!isProPlan(session.user.plan)) {
    return { success: false, error: "AI features require Pro" };
  }

  const { success: rateLimitOk } = await aiRateLimit.limit(session.user.id);
  if (!rateLimitOk) {
    return { success: false, error: "Rate limited" };
  }

  let aiJob: any;
  try {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId: session.user.id },
      select: { title: true, description: true, content: true },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    aiJob = await prisma.aiJob.create({
      data: {
        type: "AUTO_TAG",
        status: "RUNNING",
        model: MODEL,
        userId: session.user.id,
        itemId,
      },
    });

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Generate 5 concise tags (comma-separated, no # prefix).",
        },
        {
          role: "user",
          content: `Title: ${item.title}\nDescription: ${item.description}\nContent: ${item.content?.substring(0, 300)}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const tags = response.choices[0]?.message?.content
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) || [];

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: "SUCCEEDED",
        result: { tags },
        completedAt: new Date(),
      },
    });

    return { success: true, data: tags };
  } catch (error) {
    if (aiJob) {
      await prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      }).catch(() => {});
    }

    return { success: false, error: "Failed to generate tags" };
  }
}
```

### 10.2 Client Component (`src/components/items/AutoTagSuggestion.tsx`)

```typescript
"use client";

import { useState } from "react";
import { autoTagItem } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AutoTagSuggestion({ itemId }: { itemId: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    const result = await autoTagItem(itemId);
    if (result.success) {
      setTags(result.data);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <h3 className="font-semibold">AI-Generated Tags</h3>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Generating...</p>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <Button onClick={handleGenerate} disabled={isLoading} size="sm">
        {isLoading ? "Generating..." : "Generate Tags"}
      </Button>
    </div>
  );
}
```

---

## 11. References and Sources

**Codebase patterns:**
- `src/actions/items.ts`: Server action structure and error handling.
- `src/lib/usage-limits.ts`: Pro gating pattern and limit checks.
- `src/auth.ts`: Session and plan handling.
- `prisma/schema.prisma`: `AiJob` model definition.

**OpenAI documentation:**
- OpenAI API Quickstart: https://platform.openai.com/docs/quickstart
- Chat Completions: https://platform.openai.com/docs/guides/chat-completions
- Streaming: https://platform.openai.com/docs/guides/stream-processing
- Error Handling: https://platform.openai.com/docs/guides/error-handling

**DevStash specific:**
- Stripe integration pattern (cost tracking, webhook handling): `docs/stripe-integration-plan.md`
- Billing and Pro gating: `src/lib/billing.ts`, `src/lib/usage-limits.ts`

---

## 12. Future Enhancements

1. **Async Job Queue**: Move long-running AI operations to a background processor (Bull, Inngest, etc.).
2. **Prompt Versioning**: Track prompt changes and results for continuous improvement.
3. **Cost Dashboard**: Display AI usage and costs per user/plan.
4. **Feedback Loop**: Allow users to rate suggestions (✓/✗) for model fine-tuning data.
5. **Multi-Model Support**: Compare results from different models (gpt-5.4-nano vs gpt-5.4).
6. **Webhook Integration**: Notify users when AI jobs complete (email, in-app).
