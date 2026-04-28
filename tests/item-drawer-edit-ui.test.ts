import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

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
});
