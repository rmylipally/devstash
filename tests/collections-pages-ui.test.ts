import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

describe("collections pages", () => {
  it("defines protected collection routes for sidebar and card navigation", async () => {
    const [collectionsPageSource, collectionDetailPageSource] =
      await Promise.all([
        readFile("src/app/collections/page.tsx", "utf8"),
        readFile("src/app/collections/[slug]/page.tsx", "utf8"),
      ]);

    assert.match(collectionsPageSource, /auth\(\)/);
    assert.match(collectionsPageSource, /getDashboardCollections/);
    assert.match(collectionsPageSource, /Collections/);
    assert.match(collectionDetailPageSource, /auth\(\)/);
    assert.match(collectionDetailPageSource, /params: Promise/);
    assert.match(collectionDetailPageSource, /getDashboardCollections/);
    assert.match(collectionDetailPageSource, /getDashboardItemsByCollectionSlug/);
    assert.match(collectionDetailPageSource, /ItemDrawerProvider/);
    assert.match(collectionDetailPageSource, /ItemCard/);
  });
});
