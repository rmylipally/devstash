import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  toggleCollectionFavorite: vi.fn(),
  updateCollection: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: mocks.createCollection,
  deleteCollection: mocks.deleteCollection,
  toggleCollectionFavorite: mocks.toggleCollectionFavorite,
  updateCollection: mocks.updateCollection,
}));

const { POST } = await import("../src/app/api/collections/route");
const { toggleCollectionFavorite } = await import("../src/actions/collections");

describe("collection create API", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.createCollection.mockReset();
    mocks.deleteCollection.mockReset();
    mocks.toggleCollectionFavorite.mockReset();
    mocks.updateCollection.mockReset();
  });

  it("creates a collection for the signed-in user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.createCollection.mockResolvedValue({
      description: "Reusable React examples",
      dominantItemKind: null,
      id: "collection-react-patterns",
      isFavorite: false,
      itemCount: 0,
      itemTypeIds: [],
      name: "React Patterns",
      slug: "react-patterns",
      updatedAt: "2026-05-06T12:00:00.000Z",
    });

    const response = await POST(
      new Request("https://devstash.test/api/collections", {
        body: JSON.stringify({
          description: " Reusable React examples ",
          name: " React Patterns ",
        }),
        method: "POST",
      }),
    );
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.deepEqual(mocks.createCollection.mock.calls[0]?.[0], {
      data: {
        description: "Reusable React examples",
        name: "React Patterns",
      },
      userId: "user-123",
    });
  });

  it("rejects invalid collection names before creating records", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      new Request("https://devstash.test/api/collections", {
        body: JSON.stringify({
          description: "Missing name",
          name: " ",
        }),
        method: "POST",
      }),
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      error: "Collection name is required.",
    });
    assert.equal(mocks.createCollection.mock.calls.length, 0);
  });

  it("rejects unauthenticated collection creates", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(
      new Request("https://devstash.test/api/collections", {
        body: JSON.stringify({
          description: "Reusable React examples",
          name: "React Patterns",
        }),
        method: "POST",
      }),
    );

    assert.equal(response.status, 401);
    assert.equal(mocks.createCollection.mock.calls.length, 0);
  });
});

describe("collection favorite action", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.toggleCollectionFavorite.mockReset();
  });

  it("toggles favorite state for an owned collection", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.toggleCollectionFavorite.mockResolvedValue({
      description: "Reusable React examples",
      id: "collection-react-patterns",
      isFavorite: true,
      name: "React Patterns",
      slug: "react-patterns",
    });

    const result = await toggleCollectionFavorite({
      collectionId: "collection-react-patterns",
    });

    assert.deepEqual(result, {
      success: true,
      data: {
        isFavorite: true,
      },
    });
    assert.deepEqual(mocks.toggleCollectionFavorite.mock.calls[0]?.[0], {
      collectionId: "collection-react-patterns",
      userId: "user-123",
    });
  });

  it("rejects unauthenticated favorite toggles", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await toggleCollectionFavorite({
      collectionId: "collection-react-patterns",
    });

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in.",
    });
    assert.equal(mocks.toggleCollectionFavorite.mock.calls.length, 0);
  });
});
