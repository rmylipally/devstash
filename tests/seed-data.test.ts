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
      { name: "snippet", kind: "SNIPPET", icon: "Code", color: "#3b82f6", isSystem: true },
      { name: "prompt", kind: "PROMPT", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
      { name: "command", kind: "COMMAND", icon: "Terminal", color: "#f97316", isSystem: true },
      { name: "note", kind: "NOTE", icon: "StickyNote", color: "#fde047", isSystem: true },
      { name: "file", kind: "FILE", icon: "File", color: "#6b7280", isSystem: true },
      { name: "image", kind: "IMAGE", icon: "Image", color: "#ec4899", isSystem: true },
      { name: "link", kind: "LINK", icon: "Link", color: "#10b981", isSystem: true },
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
