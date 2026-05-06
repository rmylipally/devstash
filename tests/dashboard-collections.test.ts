import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  createCollection,
  getDashboardCollectionStats,
  getDashboardCollectionOptions,
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

  it("fetches collection options for item forms scoped to the user", async () => {
    const findManyArgs: unknown[] = [];
    const client = {
      collection: {
        count: async () => 0,
        findMany: async (args: unknown) => {
          findManyArgs.push(args);

          return [
            {
              id: "collection-react-patterns",
              name: "React Patterns",
              slug: "react-patterns",
            },
            {
              id: "collection-devops",
              name: "DevOps",
              slug: "devops",
            },
          ];
        },
      },
    } as DashboardCollectionClient;

    const options = await getDashboardCollectionOptions(
      { userId: "user-123" },
      client,
    );

    assert.deepEqual(findManyArgs, [
      {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        where: {
          userId: "user-123",
        },
      },
    ]);
    assert.deepEqual(options, [
      {
        id: "collection-react-patterns",
        name: "React Patterns",
        slug: "react-patterns",
      },
      {
        id: "collection-devops",
        name: "DevOps",
        slug: "devops",
      },
    ]);
  });

  it("creates user-scoped collections with unique slugs", async () => {
    const findUniqueArgs: unknown[] = [];
    const createArgs: unknown[] = [];
    const client = {
      collection: {
        count: async () => 0,
        create: async (args: unknown) => {
          createArgs.push(args);
          return {
            description: "Reusable React examples",
            id: "collection-react-patterns-2",
            isFavorite: false,
            items: [],
            name: "React Patterns!",
            slug: "react-patterns-2",
            updatedAt,
          };
        },
        findMany: async () => [],
        findUnique: async (args: { where: { userId_slug: { slug: string } } }) => {
          findUniqueArgs.push(args);
          return args.where.userId_slug.slug === "react-patterns"
            ? { id: "existing" }
            : null;
        },
      },
    };

    const collection = await createCollection(
      {
        data: {
          description: " Reusable React examples ",
          name: " React Patterns! ",
        },
        userId: "user-123",
      },
      client,
    );

    assert.deepEqual(collection, {
      description: "Reusable React examples",
      dominantItemKind: null,
      id: "collection-react-patterns-2",
      isFavorite: false,
      itemCount: 0,
      itemTypeIds: [],
      name: "React Patterns!",
      slug: "react-patterns-2",
      updatedAt: "2026-04-25T14:30:00.000Z",
    });
    assert.deepEqual(findUniqueArgs, [
      {
        select: { id: true },
        where: { userId_slug: { slug: "react-patterns", userId: "user-123" } },
      },
      {
        select: { id: true },
        where: { userId_slug: { slug: "react-patterns-2", userId: "user-123" } },
      },
    ]);
    assert.deepEqual(createArgs[0], {
      data: {
        description: "Reusable React examples",
        name: "React Patterns!",
        slug: "react-patterns-2",
        userId: "user-123",
      },
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
        },
        name: true,
        slug: true,
        updatedAt: true,
      },
    });
  });
});
