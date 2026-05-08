import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createItemRecord: vi.fn(),
  deleteItemRecord: vi.fn(),
  deleteS3Object: vi.fn(),
  getItemDetail: vi.fn(),
  toggleItemFavoriteRecord: vi.fn(),
  toggleItemPinRecord: vi.fn(),
  updateItemRecord: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: mocks.createItemRecord,
  deleteItem: mocks.deleteItemRecord,
  getItemDetail: mocks.getItemDetail,
  toggleItemFavorite: mocks.toggleItemFavoriteRecord,
  toggleItemPin: mocks.toggleItemPinRecord,
  updateItem: mocks.updateItemRecord,
}));

vi.mock("@/lib/storage/s3", () => ({
  deleteS3Object: mocks.deleteS3Object,
}));

const { createItem, deleteItem, toggleItemFavorite, toggleItemPin, updateItem } = await import("../src/actions/items");

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
    mocks.deleteS3Object.mockReset();
    mocks.getItemDetail.mockReset();
    mocks.toggleItemFavoriteRecord.mockReset();
    mocks.toggleItemPinRecord.mockReset();
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

  it("passes selected collections when creating an item", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.createItemRecord.mockResolvedValue({
      ...itemDetail,
      id: "item-new-snippet",
      title: "Fetch helper",
    });

    const result = await createItem({
      collectionIds: [
        " collection-react-patterns ",
        "collection-devops",
        "collection-react-patterns",
        "",
      ],
      content: "export async function getJson() {}",
      kind: "snippet",
      tags: [],
      title: "Fetch helper",
    });

    assert.equal(result.success, true);
    assert.deepEqual(mocks.createItemRecord.mock.calls[0]?.[0], {
      data: {
        collectionIds: ["collection-react-patterns", "collection-devops"],
        content: "export async function getJson() {}",
        kind: "snippet",
        tags: [],
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

  it("rejects link URLs with unsafe protocols", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const result = await createItem({
      kind: "link",
      tags: [],
      title: "Script",
      url: "javascript:alert(1)",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Enter a valid URL/);
    assert.equal(mocks.createItemRecord.mock.calls.length, 0);
  });

  it("creates image items with uploaded file metadata", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.createItemRecord.mockResolvedValue({
      ...itemDetail,
      contentKind: "file",
      fileSizeBytes: 2048,
      id: "item-architecture-diagram",
      kind: "image",
      mimeType: "image/png",
      originalFileName: "architecture.png",
      storageKey:
        "devstash/api/uploads/user-123/image/upload-123-architecture.png",
      title: "Architecture Diagram",
    });

    const result = await createItem({
      description: " System diagram ",
      fileSizeBytes: 2048,
      kind: "image",
      mimeType: "image/png",
      originalFileName: "architecture.png",
      storageKey:
        "devstash/api/uploads/user-123/image/upload-123-architecture.png",
      tags: [" docs "],
      title: " Architecture Diagram ",
    });

    assert.equal(result.success, true);
    assert.deepEqual(mocks.createItemRecord.mock.calls[0]?.[0], {
      data: {
        description: "System diagram",
        fileSizeBytes: 2048,
        kind: "image",
        mimeType: "image/png",
        originalFileName: "architecture.png",
        storageKey:
          "devstash/api/uploads/user-123/image/upload-123-architecture.png",
        tags: ["docs"],
        title: "Architecture Diagram",
      },
      userId: "user-123",
    });
  });

  it("rejects file items without uploaded file metadata", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const result = await createItem({
      kind: "file",
      tags: [],
      title: "Runbook",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Upload a file before creating this item/);
    assert.equal(mocks.createItemRecord.mock.calls.length, 0);
  });

  it("rejects uploaded file metadata scoped to a different user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const result = await createItem({
      fileSizeBytes: 2048,
      kind: "file",
      mimeType: "text/markdown",
      originalFileName: "runbook.md",
      storageKey:
        "devstash/api/uploads/other-user/file/upload-123-runbook.md",
      tags: [],
      title: "Runbook",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Upload a file before creating this item/);
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

  it("passes selected collections when updating an item", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.getItemDetail.mockResolvedValue({ id: "item-use-debounce-hook" });
    mocks.updateItemRecord.mockResolvedValue(itemDetail);

    const result = await updateItem("item-use-debounce-hook", {
      collectionIds: [
        "collection-react-patterns",
        " collection-devops ",
        "collection-react-patterns",
      ],
      content: " const value = true; ",
      language: " typescript ",
      tags: [" react "],
      title: " Updated Hook ",
    });

    assert.equal(result.success, true);
    assert.deepEqual(mocks.updateItemRecord.mock.calls[0]?.[0], {
      data: {
        collectionIds: ["collection-react-patterns", "collection-devops"],
        content: "const value = true;",
        language: "typescript",
        tags: ["react"],
        title: "Updated Hook",
      },
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
  });

  it("rejects unsafe link URL updates before writing to the database", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const result = await updateItem("item-link", {
      tags: [],
      title: "Docs",
      url: "data:text/html,<script>alert(1)</script>",
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Enter a valid URL/);
    assert.equal(mocks.getItemDetail.mock.calls.length, 0);
    assert.equal(mocks.updateItemRecord.mock.calls.length, 0);
  });

  it("does not allow existing link items to be updated without a URL", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.getItemDetail.mockResolvedValue({
      ...itemDetail,
      contentKind: "url",
      kind: "link",
      sourceUrl: "https://example.com",
    });

    const result = await updateItem("item-link", {
      tags: [],
      title: "Docs",
      url: null,
    });

    assert.equal(result.success, false);
    assert.match(result.error, /URL is required for links/);
    assert.equal(mocks.updateItemRecord.mock.calls.length, 0);
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
    mocks.getItemDetail.mockResolvedValue(itemDetail);
    mocks.deleteItemRecord.mockResolvedValue(true);

    const result = await deleteItem("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: true,
    });
    assert.deepEqual(mocks.deleteItemRecord.mock.calls[0]?.[0], {
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
    assert.equal(mocks.deleteS3Object.mock.calls.length, 0);
  });

  it("deletes uploaded objects from S3 before deleting file-backed item records", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.getItemDetail.mockResolvedValue({
      ...itemDetail,
      contentKind: "file",
      kind: "file",
      storageKey: "devstash/api/uploads/user-123/file/upload-123-runbook.md",
    });
    mocks.deleteItemRecord.mockResolvedValue(true);
    mocks.deleteS3Object.mockResolvedValue(undefined);

    const result = await deleteItem("item-runbook");

    assert.deepEqual(result, {
      success: true,
    });
    assert.deepEqual(mocks.getItemDetail.mock.calls[0]?.[0], {
      itemId: "item-runbook",
      userId: "user-123",
    });
    assert.deepEqual(mocks.deleteItemRecord.mock.calls[0]?.[0], {
      itemId: "item-runbook",
      userId: "user-123",
    });
    assert.equal(
      mocks.deleteS3Object.mock.calls[0]?.[0],
      "devstash/api/uploads/user-123/file/upload-123-runbook.md",
    );
    assert.equal(
      mocks.deleteS3Object.mock.invocationCallOrder[0] <
        mocks.deleteItemRecord.mock.invocationCallOrder[0],
      true,
    );
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
    mocks.getItemDetail.mockResolvedValue(null);

    const result = await deleteItem("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: false,
      error: "Item not found.",
    });
    assert.equal(mocks.deleteItemRecord.mock.calls.length, 0);
    assert.equal(mocks.deleteS3Object.mock.calls.length, 0);
  });

  it("toggles favorite state for an owned item", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.toggleItemFavoriteRecord.mockResolvedValue({
      ...itemDetail,
      isFavorite: true,
    });

    const result = await toggleItemFavorite("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: true,
      data: {
        ...itemDetail,
        isFavorite: true,
      },
    });
    assert.deepEqual(mocks.toggleItemFavoriteRecord.mock.calls[0]?.[0], {
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
  });

  it("rejects unauthenticated favorite toggles", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in to update items.",
    });
    assert.equal(mocks.toggleItemFavoriteRecord.mock.calls.length, 0);
  });

  it("toggles pin state for an owned item", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.toggleItemPinRecord.mockResolvedValue({
      ...itemDetail,
      isPinned: true,
    });

    const result = await toggleItemPin("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: true,
      data: {
        ...itemDetail,
        isPinned: true,
      },
    });
    assert.deepEqual(mocks.toggleItemPinRecord.mock.calls[0]?.[0], {
      itemId: "item-use-debounce-hook",
      userId: "user-123",
    });
  });

  it("rejects unauthenticated pin toggles", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await toggleItemPin("item-use-debounce-hook");

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in to update items.",
    });
    assert.equal(mocks.toggleItemPinRecord.mock.calls.length, 0);
  });
});
