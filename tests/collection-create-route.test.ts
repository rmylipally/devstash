import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCollection: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: mocks.createCollection,
}));

const { POST } = await import("../src/app/api/collections/route");

describe("collection create API", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.createCollection.mockReset();
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
