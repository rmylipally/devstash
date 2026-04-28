import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  getDashboardItemTypes,
  getDashboardItemsByType,
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

  it("fetches dashboard items filtered by item type with user scoping", async () => {
    const findManyArgs: DashboardItemFindManyArgs[] = [];
    const client: DashboardItemClient = {
      item: {
        count: async () => 0,
        findMany: async (args) => {
          findManyArgs.push(args);
          return [itemRow({ kind: "NOTE" })];
        },
      },
    };

    const items = await getDashboardItemsByType(
      { kind: "note", userId: "user-123" },
      client,
    );

    assert.deepEqual(findManyArgs[0]?.where, {
      kind: "NOTE",
      userId: "user-123",
    });
    assert.deepEqual(findManyArgs[0]?.orderBy, { lastViewedAt: "desc" });
    assert.equal(items[0]?.kind, "note");
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

  it("fetches sidebar item types with grouped database counts and system metadata", async () => {
    const groupByArgs: unknown[] = [];
    const itemTypeFindManyArgs: unknown[] = [];
    const client = {
      item: {
        count: async () => {
          throw new Error("item.count should not be called for item type counts");
        },
        findMany: async () => [],
        groupBy: async (args: unknown) => {
          groupByArgs.push(args);

          return [
            { _count: { _all: 7 }, kind: "SNIPPET" },
            { _count: { _all: 5 }, kind: "PROMPT" },
            { _count: { _all: 3 }, kind: "NOTE" },
            { _count: { _all: 2 }, kind: "COMMAND" },
            { _count: { _all: 1 }, kind: "FILE" },
            { _count: { _all: 4 }, kind: "LINK" },
          ];
        },
      },
      itemType: {
        findMany: async (args: unknown) => {
          itemTypeFindManyArgs.push(args);

          return [
            {
              color: "#3b82f6",
              icon: "Code",
              id: "snippet",
              isPro: false,
              kind: "SNIPPET",
              label: "Saved Snippet",
              pluralLabel: "Saved Snippets",
              slug: "snippets",
            },
            {
              color: "#8b5cf6",
              icon: "Sparkles",
              id: "prompt",
              isPro: false,
              kind: "PROMPT",
              label: "Prompt",
              pluralLabel: "Prompts",
              slug: "prompts",
            },
            {
              color: "#f97316",
              icon: "Terminal",
              id: "command",
              isPro: false,
              kind: "COMMAND",
              label: "Command",
              pluralLabel: "Commands",
              slug: "commands",
            },
            {
              color: "#fde047",
              icon: "StickyNote",
              id: "note",
              isPro: false,
              kind: "NOTE",
              label: "Note",
              pluralLabel: "Notes",
              slug: "notes",
            },
            {
              color: "#6b7280",
              icon: "File",
              id: "file",
              isPro: true,
              kind: "FILE",
              label: "File",
              pluralLabel: "Files",
              slug: "files",
            },
            {
              color: "#ec4899",
              icon: "Image",
              id: "image",
              isPro: true,
              kind: "IMAGE",
              label: "Image",
              pluralLabel: "Images",
              slug: "images",
            },
            {
              color: "#10b981",
              icon: "Link",
              id: "link",
              isPro: false,
              kind: "LINK",
              label: "Link",
              pluralLabel: "Links",
              slug: "links",
            },
          ];
        },
      },
    } as unknown as DashboardItemClient;

    const itemTypes = await getDashboardItemTypes(
      { userId: "user-123" },
      client,
    );

    assert.deepEqual(
      itemTypes.map(
        ({ color, count, icon, id, isPro, label, pluralLabel, slug }) => ({
          color,
          count,
          icon,
          id,
          isPro,
          label,
          pluralLabel,
          slug,
        }),
      ),
      [
        {
          color: "#3b82f6",
          count: 7,
          icon: "Code",
          id: "snippet",
          isPro: false,
          label: "Saved Snippet",
          pluralLabel: "Saved Snippets",
          slug: "snippets",
        },
        {
          color: "#8b5cf6",
          count: 5,
          icon: "Sparkles",
          id: "prompt",
          isPro: false,
          label: "Prompt",
          pluralLabel: "Prompts",
          slug: "prompts",
        },
        {
          color: "#f97316",
          count: 2,
          icon: "Terminal",
          id: "command",
          isPro: false,
          label: "Command",
          pluralLabel: "Commands",
          slug: "commands",
        },
        {
          color: "#fde047",
          count: 3,
          icon: "StickyNote",
          id: "note",
          isPro: false,
          label: "Note",
          pluralLabel: "Notes",
          slug: "notes",
        },
        {
          color: "#6b7280",
          count: 1,
          icon: "File",
          id: "file",
          isPro: true,
          label: "File",
          pluralLabel: "Files",
          slug: "files",
        },
        {
          color: "#ec4899",
          count: 0,
          icon: "Image",
          id: "image",
          isPro: true,
          label: "Image",
          pluralLabel: "Images",
          slug: "images",
        },
        {
          color: "#10b981",
          count: 4,
          icon: "Link",
          id: "link",
          isPro: false,
          label: "Link",
          pluralLabel: "Links",
          slug: "links",
        },
      ],
    );
    assert.deepEqual(groupByArgs, [
      {
        _count: { _all: true },
        by: ["kind"],
        where: { userId: "user-123" },
      },
    ]);
    assert.deepEqual(itemTypeFindManyArgs, [
      {
        orderBy: { sortOrder: "asc" },
        select: {
          color: true,
          icon: true,
          id: true,
          isPro: true,
          kind: true,
          label: true,
          pluralLabel: true,
          slug: true,
        },
        where: { isSystem: true },
      },
    ]);
  });
});
