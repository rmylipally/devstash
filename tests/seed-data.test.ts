import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  collectionSeeds,
  demoUserSeed,
  itemSeeds,
  systemItemTypeSeeds,
} from "../prisma/seed-data";

describe("seed data contract", () => {
  it("defines the demo user from the seed specification", () => {
    assert.equal(demoUserSeed.email, "demo@devstash.io");
    assert.equal(demoUserSeed.name, "Demo User");
    assert.equal(demoUserSeed.password, "12345678");
    assert.equal(demoUserSeed.plan, "FREE");
  });

  it("defines all built-in system item type metadata", () => {
    assert.deepEqual(systemItemTypeSeeds, [
      {
        color: "#3b82f6",
        icon: "Code",
        isPro: false,
        isSystem: true,
        kind: "SNIPPET",
        label: "Snippet",
        name: "snippet",
        pluralLabel: "Snippets",
        slug: "snippets",
        sortOrder: 1,
      },
      {
        color: "#8b5cf6",
        icon: "Sparkles",
        isPro: false,
        isSystem: true,
        kind: "PROMPT",
        label: "Prompt",
        name: "prompt",
        pluralLabel: "Prompts",
        slug: "prompts",
        sortOrder: 2,
      },
      {
        color: "#f97316",
        icon: "Terminal",
        isPro: false,
        isSystem: true,
        kind: "COMMAND",
        label: "Command",
        name: "command",
        pluralLabel: "Commands",
        slug: "commands",
        sortOrder: 3,
      },
      {
        color: "#fde047",
        icon: "StickyNote",
        isPro: false,
        isSystem: true,
        kind: "NOTE",
        label: "Note",
        name: "note",
        pluralLabel: "Notes",
        slug: "notes",
        sortOrder: 4,
      },
      {
        color: "#6b7280",
        icon: "File",
        isPro: true,
        isSystem: true,
        kind: "FILE",
        label: "File",
        name: "file",
        pluralLabel: "Files",
        slug: "files",
        sortOrder: 5,
      },
      {
        color: "#ec4899",
        icon: "Image",
        isPro: true,
        isSystem: true,
        kind: "IMAGE",
        label: "Image",
        name: "image",
        pluralLabel: "Images",
        slug: "images",
        sortOrder: 6,
      },
      {
        color: "#10b981",
        icon: "Link",
        isPro: false,
        isSystem: true,
        kind: "LINK",
        label: "Link",
        name: "link",
        pluralLabel: "Links",
        slug: "links",
        sortOrder: 7,
      },
    ]);
  });

  it("defines the required collections and item counts", () => {
    const collectionNames = collectionSeeds.map((collection) => collection.name);

    assert.deepEqual(collectionNames, [
      "React Patterns",
      "AI Workflows",
      "DevOps",
      "Terminal Commands",
      "Design Resources",
    ]);

    assert.equal(
      itemSeeds.filter((item) => item.collectionSlug === "react-patterns").length,
      3,
    );
    assert.equal(
      itemSeeds.filter((item) => item.collectionSlug === "ai-workflows").length,
      3,
    );
    assert.equal(
      itemSeeds.filter((item) => item.collectionSlug === "devops").length,
      4,
    );
    assert.equal(
      itemSeeds.filter((item) => item.collectionSlug === "terminal-commands")
        .length,
      4,
    );
    assert.equal(
      itemSeeds.filter((item) => item.collectionSlug === "design-resources")
        .length,
      4,
    );
  });

  it("uses real URLs for all seeded links", () => {
    const linkItems = itemSeeds.filter((item) => item.contentKind === "URL");

    assert.equal(linkItems.length, 6);
    for (const item of linkItems) {
      assert.match(item.sourceUrl ?? "", /^https:\/\/[^ ]+\.[^ ]+$/);
    }
  });

  it("keeps seed identifiers unique for idempotent upserts", () => {
    const itemIds = new Set(itemSeeds.map((item) => item.id));
    const collectionSlugs = new Set(
      collectionSeeds.map((collection) => collection.slug),
    );

    assert.equal(itemIds.size, itemSeeds.length);
    assert.equal(collectionSlugs.size, collectionSeeds.length);
  });
});
