import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

describe("item drawer edit UI", () => {
  it("renders the title editor in the drawer header while editing", async () => {
    const source = await readFile(
      "src/components/items/ItemDrawerProvider.tsx",
      "utf8",
    );

    assert.match(source, /function ItemDrawerHeaderTitle/);
    assert.match(source, /aria-label="Item title"/);
    assert.doesNotMatch(source, /<DetailSection title="Title">/);
  });

  it("wires favorite toggle controls for drawer and cards", async () => {
    const source = await readFile(
      "src/components/items/ItemDrawerProvider.tsx",
      "utf8",
    );

    assert.match(source, /toggleItemFavorite/);
    assert.match(source, /onToggleFavorite/);
    assert.match(source, /function ItemFavoriteToggleButton/);
    assert.match(source, /aria-label=\{`\$\{isFavorite \? "Unfavorite" : "Favorite"\}/);
  });
});
