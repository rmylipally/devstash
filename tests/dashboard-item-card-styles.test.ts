import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("dashboard item card styles", () => {
  it("uses item-kind left border accents on recent item rows", async () => {
    const source = await readFile(
      "src/components/items/ItemDrawerProvider.tsx",
      "utf8",
    );
    const recentItemRowSource = source.match(
      /export function RecentItemRow\(\{ item \}: \{ item: DashboardItem \}\) \{[\s\S]*?interface ItemDrawerContentProps/,
    )?.[0];

    assert.ok(recentItemRowSource, "RecentItemRow source should be present");
    assert.match(recentItemRowSource, /border-l-4/);
    assert.match(recentItemRowSource, /itemKindAccentStyles\[item\.kind\]/);
  });
});
