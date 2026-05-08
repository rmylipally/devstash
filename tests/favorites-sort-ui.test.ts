import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

describe("favorites sorting UI", () => {
  it("adds client-side sort controls for name, date, and item type", async () => {
    const source = await readFile(
      "src/components/favorites/FavoritesList.tsx",
      "utf8",
    );

    assert.match(source, /type FavoritesSortField = "date" \| "itemType" \| "name"/);
    assert.match(source, /Sort favorites client-side/);
    assert.match(source, /id="favorites-sort-field"/);
    assert.match(source, /<option value="date">Date<\/option>/);
    assert.match(source, /<option value="name">Name<\/option>/);
    assert.match(source, /<option value="itemType">Item Type<\/option>/);
    assert.match(source, /setSortDirection\(\(currentDirection\) =>/);
  });

  it("sorts both items and collections with memoized client-side arrays", async () => {
    const source = await readFile(
      "src/components/favorites/FavoritesList.tsx",
      "utf8",
    );

    assert.match(source, /const sortedItems = useMemo\(/);
    assert.match(source, /const sortedCollections = useMemo\(/);
    assert.match(source, /sortField === "name"/);
    assert.match(source, /sortField === "itemType"/);
    assert.match(source, /new Date\(firstItem\.uploadedAt\)\.getTime\(\)/);
    assert.match(source, /new Date\(firstCollection\.updatedAt\)\.getTime\(\)/);
    assert.match(source, /if \(sortDirection === "desc"\) \{/);
  });
});
