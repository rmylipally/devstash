import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("dashboard item card styles", () => {
  it("uses item-kind left border accents on recent item rows", async () => {
    const source = await readFile("src/components/dashboard/DashboardShell.tsx", "utf8");
    const recentItemRowSource = source.match(
      /function RecentItemRow\(\{ item \}: RecentItemRowProps\) \{[\s\S]*?function TagList/,
    )?.[0];

    assert.ok(recentItemRowSource, "RecentItemRow source should be present");
    assert.match(recentItemRowSource, /border-l-4/);
    assert.match(recentItemRowSource, /itemKindAccentStyles\[item\.kind\]/);
  });
});
