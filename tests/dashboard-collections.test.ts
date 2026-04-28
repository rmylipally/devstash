import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  getDashboardCollectionStats,
  getDashboardCollections,
  toDashboardCollection,
  type DashboardCollectionClient,
  type DashboardCollectionFindManyArgs,
  type DashboardCollectionRow,
} from "../src/lib/db/collections";

const updatedAt = new Date("2026-04-25T14:30:00.000Z");

function collectionRow(
  itemKinds: DashboardCollectionRow["items"][number]["item"]["kind"][],
): DashboardCollectionRow {
  return {
    description: null,
    id: "collection-ai-workflows",
    isFavorite: true,
    items: itemKinds.map((kind) => ({ item: { kind } })),
    name: "AI Workflows",
    slug: "ai-workflows",
    updatedAt,
  };
}

describe("dashboard collection data", () => {
  it("maps database rows into dashboard collection card data", () => {
    const collection = toDashboardCollection(
      collectionRow(["PROMPT", "SNIPPET", "PROMPT", "LINK", "SNIPPET", "PROMPT"]),
    );

    assert.deepEqual(collection, {
      description: "No description yet.",
      dominantItemKind: "prompt",
      id: "collection-ai-workflows",
      isFavorite: true,
      itemCount: 6,
      itemTypeIds: ["prompt", "snippet", "link"],
      name: "AI Workflows",
      slug: "ai-workflows",
      updatedAt: "2026-04-25T14:30:00.000Z",
    });
  });

  it("fetches recent dashboard collections with a scoped database query", async () => {
    const findManyArgs: DashboardCollectionFindManyArgs[] = [];
    const client: DashboardCollectionClient = {
      collection: {
        count: async () => 0,
        findMany: async (args) => {
          findManyArgs.push(args);
          return [collectionRow(["COMMAND", "COMMAND", "NOTE"])];
        },
      },
    };

    const collections = await getDashboardCollections(
      { limit: 6, userId: "user-123" },
      client,
    );

    assert.equal(findManyArgs.length, 1);
    assert.deepEqual(findManyArgs[0], {
      orderBy: { updatedAt: "desc" },
      select: {
        description: true,
        id: true,
        isFavorite: true,
        items: {
          select: {
            item: {
              select: {
                kind: true,
              },
            },
          },
          where: {
            item: {
              userId: "user-123",
            },
          },
        },
        name: true,
        slug: true,
        updatedAt: true,
      },
      take: 6,
      where: {
        userId: "user-123",
      },
    });
    assert.equal(collections[0]?.dominantItemKind, "command");
    assert.deepEqual(collections[0]?.itemTypeIds, ["command", "note"]);
  });

  it("fetches recent dashboard collections by user email when no user id is available", async () => {
    const findManyArgs: DashboardCollectionFindManyArgs[] = [];
    const client: DashboardCollectionClient = {
      collection: {
        count: async () => 0,
        findMany: async (args) => {
          findManyArgs.push(args);
          return [collectionRow(["LINK"])];
        },
      },
    };

    await getDashboardCollections({ limit: 6, userEmail: "demo@devstash.io" }, client);

    assert.deepEqual(findManyArgs[0]?.where, {
      user: {
        email: "demo@devstash.io",
      },
    });
    assert.deepEqual(findManyArgs[0]?.select.items.where, {
      item: {
        user: {
          email: "demo@devstash.io",
        },
      },
    });
  });

  it("counts total and favorite collections with the same user scope", async () => {
    const countArgs: Array<{ where?: { isFavorite?: boolean; userId?: string } }> =
      [];
    const client: DashboardCollectionClient = {
      collection: {
        count: async (args) => {
          countArgs.push(args);
          return args.where?.isFavorite ? 2 : 8;
        },
        findMany: async () => [],
      },
    };

    const stats = await getDashboardCollectionStats(
      { userId: "user-123" },
      client,
    );

    assert.deepEqual(stats, {
      favorite: 2,
      total: 8,
    });
    assert.deepEqual(countArgs, [
      { where: { userId: "user-123" } },
      { where: { isFavorite: true, userId: "user-123" } },
    ]);
  });
});
