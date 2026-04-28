import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createItemRecord: vi.fn(),
  deleteItemRecord: vi.fn(),
  getItemDetail: vi.fn(),
  updateItemRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: mocks.createItemRecord,
  deleteItem: mocks.deleteItemRecord,
  getItemDetail: mocks.getItemDetail,
  updateItem: mocks.updateItemRecord,
}));

const { createItem, deleteItem, updateItem } = await import("../src/actions/items");

const itemDetail = {
  aiSummary: null,
  collections: [],
  content: "const value = true;",
  contentKind: "text",
  createdAt: "2026-04-25T13:00:00.000Z",
  description: "Updated description",
  fileSizeBytes: null,
  id: "item-use-debounce-hook",
  isFavorite: false,
  isPinned: false,
  kind: "snippet",
  language: "typescript",
  mimeType: null,
  originalFileName: null,
  sourceUrl: null,
  storageKey: null,
  tags: ["react", "hooks"],
  title: "Updated Hook",
  updatedAt: "2026-04-28T12:00:00.000Z",
};

describe("item actions", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.createItemRecord.mockReset();
    mocks.deleteItemRecord.mockReset();
    mocks.getItemDetail.mockReset();
    mocks.updateItemRecord.mockReset();
  });

  it("creates an item for the signed-in user with normalized fields", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.createItemRecord.mockResolvedValue({
      ...itemDetail,
      id: "item-new-snippet",
      title: "Fetch helper",
    });

    const result = await createItem({
      content: " export async function getJson() {} ",
      description: " Shared fetch helper ",
      kind: "snippet",
      language: " typescript ",
      tags: [" helpers ", "api", "helpers"],
      title: " Fetch helper ",
    });

    assert.deepEqual(result, {
      success: true,
      data: {
        ...itemDetail,
        id: "item-new-snippet",
        title: "Fetch helper",
      },
    });
    assert.deepEqual(mocks.createItemRecord.mock.calls[0]?.[0], {
      data: {
        content: "export async function getJson() {}",
        description: "Shared fetch helper",
        kind: "snippet",
        language: "typescript",
        tags: ["helpers", "api"],
        title: "Fetch helper",
      },
      userId: "user-123",
    });
  });

  it("requires an absolute URL when creating link items", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const result = await createItem({
      kind: "link",
      tags: [],
      title: "Docs",
      url: "not-a-url",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Enter a valid URL/);
    assert.equal(mocks.createItemRecord.mock.calls.length, 0);
  });

  it("rejects unauthenticated item creates", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createItem({
      kind: "note",
      tags: [],
      title: "Release notes",
    });

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in to create items.",
    });
    assert.equal(mocks.createItemRecord.mock.calls.length, 0);
  });

  it("validates ownership and updates item data with normalized fields", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.getItemDetail.mockResolvedValue({ id: "item-use-debounce-hook" });
    mocks.updateItemRecord.mockResolvedValue(itemDetail);

    const result = await updateItem("item-use-debounce-hook", {
      content: " const value = true; ",
      description: " Updated description ",
      language: " typescript ",
      tags: [" react ", "hooks"],
      title: " Updated Hook ",
      url: null,
    });

    assert.deepEqual(result, {
      success: true,
      data: itemDetail,
    });
    assert.deepEqual(mocks.getItemDetail.mock.calls[0]?.[0], {
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
    assert.deepEqual(mocks.updateItemRecord.mock.calls[0]?.[0], {
      data: {
        content: "const value = true;",
        description: "Updated description",
        language: "typescript",
        tags: ["react", "hooks"],
        title: "Updated Hook",
        url: null,
      },
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
  });

  it("rejects unauthenticated item updates", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await updateItem("item-use-debounce-hook", {
      tags: [],
      title: "Updated Hook",
    });

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in to update items.",
    });
    assert.equal(mocks.getItemDetail.mock.calls.length, 0);
    assert.equal(mocks.updateItemRecord.mock.calls.length, 0);
  });

  it("returns validation errors before updating the database", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const result = await updateItem("item-use-debounce-hook", {
      tags: ["react"],
      title: " ",
      url: "not a url",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Title is required/);
    assert.equal(mocks.getItemDetail.mock.calls.length, 0);
    assert.equal(mocks.updateItemRecord.mock.calls.length, 0);
  });

  it("does not update items the user does not own", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.getItemDetail.mockResolvedValue(null);

    const result = await updateItem("item-use-debounce-hook", {
      tags: [],
      title: "Updated Hook",
    });

    assert.deepEqual(result, {
      success: false,
      error: "Item not found.",
    });
    assert.equal(mocks.updateItemRecord.mock.calls.length, 0);
  });

  it("deletes an item for the signed-in owner", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.deleteItemRecord.mockResolvedValue(true);

    const result = await deleteItem("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: true,
    });
    assert.deepEqual(mocks.deleteItemRecord.mock.calls[0]?.[0], {
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
  });

  it("rejects unauthenticated item deletes", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await deleteItem("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in to delete items.",
    });
    assert.equal(mocks.deleteItemRecord.mock.calls.length, 0);
  });

  it("does not delete items the user does not own", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.deleteItemRecord.mockResolvedValue(false);

    const result = await deleteItem("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: false,
      error: "Item not found.",
    });
  });
});
