import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createItemRecord: vi.fn(),
  getDashboardItemStats: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: mocks.createItemRecord,
  deleteItem: vi.fn(),
  getDashboardItemStats: mocks.getDashboardItemStats,
  getItemDetail: vi.fn(),
  toggleItemFavorite: vi.fn(),
  toggleItemPin: vi.fn(),
  updateItem: vi.fn(),
}));

vi.mock("@/lib/storage/s3", () => ({
  deleteS3Object: vi.fn(),
}));

const { createItem } = await import("../src/actions/items");

describe("billing gating", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.createItemRecord.mockReset();
    mocks.getDashboardItemStats.mockReset();
    mocks.getDashboardItemStats.mockResolvedValue({ favorite: 0, total: 0 });
  });

  it("blocks file item creation for free plan users", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123", plan: "free" } });

    const result = await createItem({
      fileSizeBytes: 2048,
      kind: "file",
      mimeType: "text/plain",
      originalFileName: "notes.txt",
      storageKey: "devstash/api/uploads/user-123/file/upload-123-notes.txt",
      tags: [],
      title: "Notes",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /available on Pro/);
    assert.equal(mocks.createItemRecord.mock.calls.length, 0);
  });

  it("blocks free users at the item limit", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123", plan: "free" } });
    mocks.getDashboardItemStats.mockResolvedValue({ favorite: 0, total: 50 });

    const result = await createItem({
      content: "console.log('hello');",
      kind: "snippet",
      tags: [],
      title: "Hello",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /limited to 50 items/);
    assert.equal(mocks.createItemRecord.mock.calls.length, 0);
  });

  it("allows pro users beyond free item limits", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123", plan: "pro" } });
    mocks.getDashboardItemStats.mockResolvedValue({ favorite: 0, total: 100 });
    mocks.createItemRecord.mockResolvedValue({
      aiSummary: null,
      collections: [],
      content: "console.log('hello');",
      contentKind: "text",
      createdAt: "2026-04-25T13:00:00.000Z",
      description: null,
      fileSizeBytes: null,
      id: "item-hello",
      isFavorite: false,
      isPinned: false,
      kind: "snippet",
      language: null,
      mimeType: null,
      originalFileName: null,
      sourceUrl: null,
      storageKey: null,
      tags: [],
      title: "Hello",
      updatedAt: "2026-04-25T13:00:00.000Z",
    });

    const result = await createItem({
      content: "console.log('hello');",
      kind: "snippet",
      tags: [],
      title: "Hello",
    });

    assert.equal(result.success, true);
    assert.equal(mocks.createItemRecord.mock.calls.length, 1);
  });
});
