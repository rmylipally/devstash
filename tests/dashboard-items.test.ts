import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getDashboardItemStats,
  getDashboardPinnedItems,
  getDashboardRecentItems,
  toDashboardItem,
  type DashboardItemClient,
  type DashboardItemFindManyArgs,
  type DashboardItemRow,
} from "../src/lib/db/items";

const viewedAt = new Date("2026-04-25T15:30:00.000Z");
const updatedAt = new Date("2026-04-25T16:00:00.000Z");

function itemRow(
  overrides: Partial<DashboardItemRow> = {},
): DashboardItemRow {
  return {
    description: null,
    id: "item-use-debounce-hook",
    isFavorite: true,
    isPinned: true,
    kind: "SNIPPET",
    lastViewedAt: viewedAt,
    tags: [
      { tag: { name: "react" } },
      { tag: { name: "hooks" } },
      { tag: { name: "performance" } },
    ],
    title: "useDebounce Hook",
    updatedAt,
    ...overrides,
  };
}

describe("dashboard item data", () => {
  it("maps database rows into dashboard item data", () => {
    const item = toDashboardItem(itemRow());

    assert.deepEqual(item, {
      description: "No description yet.",
      id: "item-use-debounce-hook",
      isFavorite: true,
      isPinned: true,
      kind: "snippet",
      lastViewedAt: "2026-04-25T15:30:00.000Z",
      tags: ["react", "hooks", "performance"],
      title: "useDebounce Hook",
    });
  });

  it("uses updatedAt when an item has not been viewed yet", () => {
    const item = toDashboardItem(itemRow({ lastViewedAt: null }));

    assert.equal(item.lastViewedAt, "2026-04-25T16:00:00.000Z");
  });

  it("fetches pinned dashboard items with user scoping", async () => {
    const findManyArgs: DashboardItemFindManyArgs[] = [];
    const client: DashboardItemClient = {
      item: {
        count: async () => 0,
        findMany: async (args) => {
          findManyArgs.push(args);
          return [itemRow({ kind: "PROMPT" })];
        },
      },
    };

    const items = await getDashboardPinnedItems(
      { limit: 4, userEmail: "demo@devstash.io" },
      client,
    );

    assert.equal(findManyArgs.length, 1);
    assert.deepEqual(findManyArgs[0], {
      orderBy: { lastViewedAt: "desc" },
      select: {
        description: true,
        id: true,
        isFavorite: true,
        isPinned: true,
        kind: true,
        lastViewedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        title: true,
        updatedAt: true,
      },
      take: 4,
      where: {
        isPinned: true,
        user: {
          email: "demo@devstash.io",
        },
      },
    });
    assert.equal(items[0]?.kind, "prompt");
  });

  it("fetches recent dashboard items with last viewed ordering", async () => {
    const findManyArgs: DashboardItemFindManyArgs[] = [];
    const client: DashboardItemClient = {
      item: {
        count: async () => 0,
        findMany: async (args) => {
          findManyArgs.push(args);
          return [itemRow({ isPinned: false, kind: "COMMAND" })];
        },
      },
    };

    const items = await getDashboardRecentItems(
      { limit: 10, userId: "user-123" },
      client,
    );

    assert.deepEqual(findManyArgs[0]?.where, {
      lastViewedAt: { not: null },
      userId: "user-123",
    });
    assert.equal(findManyArgs[0]?.take, 10);
    assert.deepEqual(findManyArgs[0]?.orderBy, { lastViewedAt: "desc" });
    assert.equal(items[0]?.kind, "command");
  });

  it("counts total and favorite dashboard items with the same user scope", async () => {
    const countArgs: DashboardItemFindManyArgs["where"][] = [];
    const client: DashboardItemClient = {
      item: {
        count: async (args) => {
          countArgs.push(args.where);
          return args.where?.isFavorite ? 3 : 18;
        },
        findMany: async () => [],
      },
    };

    const stats = await getDashboardItemStats(
      { userEmail: "demo@devstash.io" },
      client,
    );

    assert.deepEqual(stats, {
      favorite: 3,
      total: 18,
    });
    assert.deepEqual(countArgs, [
      { user: { email: "demo@devstash.io" } },
      { isFavorite: true, user: { email: "demo@devstash.io" } },
    ]);
  });
});
