import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  aiJobCreate: vi.fn(),
  aiJobUpdate: vi.fn(),
  auth: vi.fn(),
  buildRateLimitKey: vi.fn(),
  checkRateLimit: vi.fn(),
  getItemDetail: vi.fn(),
  responsesCreate: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/items", () => ({
  getItemDetail: mocks.getItemDetail,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiJob: {
      create: mocks.aiJobCreate,
      update: mocks.aiJobUpdate,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  buildRateLimitKey: mocks.buildRateLimitKey,
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/ai/rate-limit", () => ({
  aiRateLimiters: {
    autoTag: {
      limiter: {},
      prefix: "ai:auto-tag",
    },
  },
}));

vi.mock("@/lib/ai/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  getOpenAIClient: () => ({
    responses: {
      create: mocks.responsesCreate,
    },
  }),
}));

const { generateAutoTags } = await import("../src/actions/ai");

describe("generateAutoTags", () => {
  beforeEach(() => {
    mocks.aiJobCreate.mockReset();
    mocks.aiJobUpdate.mockReset();
    mocks.auth.mockReset();
    mocks.buildRateLimitKey.mockReset();
    mocks.checkRateLimit.mockReset();
    mocks.getItemDetail.mockReset();
    mocks.responsesCreate.mockReset();

    mocks.auth.mockResolvedValue({ user: { id: "user-123", plan: "pro" } });
    mocks.buildRateLimitKey.mockReturnValue("ai:auto-tag:user-123");
    mocks.checkRateLimit.mockResolvedValue({ success: true });
    mocks.aiJobUpdate.mockResolvedValue({ id: "job-123" });
  });

  it("rejects unauthenticated users", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await generateAutoTags({ title: "React hook" });

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in to generate tags.",
    });
  });

  it("rejects free-plan users", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123", plan: "free" } });

    const result = await generateAutoTags({ title: "React hook" });

    assert.deepEqual(result, {
      success: false,
      error: "AI tag suggestions are available on the Pro plan.",
    });
  });

  it("rejects when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue({ success: false });

    const result = await generateAutoTags({ title: "React hook" });

    assert.deepEqual(result, {
      success: false,
      error: "AI tag limit reached. Try again in about an hour.",
    });
  });

  it("generates normalized tags from object response format", async () => {
    mocks.responsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        tags: ["React", " Hooks ", "react", "TypeScript"],
      }),
    });

    const result = await generateAutoTags({
      content: "useMemo and useCallback patterns",
      kind: "snippet",
      title: "Memoized callbacks",
    });

    assert.deepEqual(result, {
      success: true,
      data: ["react", "hooks", "typescript"],
    });
    assert.equal(mocks.aiJobCreate.mock.calls.length, 0);
    assert.equal(mocks.responsesCreate.mock.calls.length, 1);
  });

  it("accepts array response format and logs successful jobs", async () => {
    mocks.getItemDetail.mockResolvedValue({
      content: "cache response helper",
      description: "shared util",
      id: "item-123",
      kind: "snippet",
      language: "typescript",
      sourceUrl: null,
      title: "Cache helper",
    });
    mocks.aiJobCreate.mockResolvedValue({ id: "job-123" });
    mocks.responsesCreate.mockResolvedValue({
      output_text: JSON.stringify(["Cache", "Performance", "Node.js"]),
    });

    const result = await generateAutoTags({ itemId: "item-123" });

    assert.deepEqual(result, {
      success: true,
      data: ["cache", "performance", "node.js"],
    });
    assert.deepEqual(mocks.aiJobCreate.mock.calls[0]?.[0]?.data?.type, "AUTO_TAG");
    assert.deepEqual(mocks.aiJobUpdate.mock.calls[0]?.[0]?.data?.status, "SUCCEEDED");
  });

  it("marks AiJob as failed when OpenAI request throws", async () => {
    mocks.getItemDetail.mockResolvedValue({
      content: "content",
      description: null,
      id: "item-123",
      kind: "snippet",
      language: null,
      sourceUrl: null,
      title: "Title",
    });
    mocks.aiJobCreate.mockResolvedValue({ id: "job-123" });
    mocks.responsesCreate.mockRejectedValue(new Error("OpenAI unavailable"));

    const result = await generateAutoTags({ itemId: "item-123" });

    assert.deepEqual(result, {
      success: false,
      error: "Could not generate tags right now. Please try again.",
    });
    assert.deepEqual(mocks.aiJobUpdate.mock.calls[0]?.[0]?.data?.status, "FAILED");
    assert.match(
      String(mocks.aiJobUpdate.mock.calls[0]?.[0]?.data?.error),
      /OpenAI unavailable/,
    );
  });

  it("returns configuration guidance when OpenAI credentials are missing", async () => {
    mocks.responsesCreate.mockRejectedValue(new Error("Missing credentials"));

    const result = await generateAutoTags({
      content: "const value = true;",
      kind: "snippet",
      title: "Config test",
    });

    assert.deepEqual(result, {
      success: false,
      error:
        "AI tag suggestions are not configured yet. Add OPENAI_API_KEY and try again.",
    });
  });

  it("returns a user-friendly error when AiJob creation fails", async () => {
    mocks.getItemDetail.mockResolvedValue({
      content: "content",
      description: null,
      id: "item-123",
      kind: "snippet",
      language: null,
      sourceUrl: null,
      title: "Title",
    });
    mocks.aiJobCreate.mockRejectedValue(new Error("Prisma database unavailable"));

    const result = await generateAutoTags({ itemId: "item-123" });

    assert.deepEqual(result, {
      success: false,
      error: "Could not save AI suggestion metadata. Please try again.",
    });
  });

  it("returns quota guidance when OpenAI account quota is exceeded", async () => {
    mocks.responsesCreate.mockRejectedValue(
      new Error(
        "429 You exceeded your current quota, please check your plan and billing details.",
      ),
    );

    const result = await generateAutoTags({
      content: "const value = true;",
      kind: "snippet",
      title: "Quota test",
    });

    assert.deepEqual(result, {
      success: false,
      error:
        "AI quota has been exceeded for this OpenAI account. Check billing and usage limits, then try again.",
    });
  });
});
