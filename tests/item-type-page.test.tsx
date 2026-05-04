import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { ItemTypePage } from "../src/components/items/ItemTypePage";
import type { DashboardItem, DashboardItemType } from "../src/lib/db/items";

const itemType: DashboardItemType = {
  color: "#3b82f6",
  count: 2,
  icon: "Code",
  id: "snippet",
  isPro: false,
  label: "Snippet",
  pluralLabel: "Snippets",
  slug: "snippets",
};

const items: DashboardItem[] = [
  {
    description: "Delay fast-changing values before expensive effects.",
    id: "item-use-debounce-hook",
    isFavorite: true,
    isPinned: true,
    kind: "snippet",
    lastViewedAt: "2026-04-25T15:30:00.000Z",
    tags: ["react", "hooks", "performance"],
    title: "useDebounce Hook",
  },
];

describe("item type page", () => {
  it("renders a responsive item grid with type-colored card borders", () => {
    const html = renderToStaticMarkup(
      <ItemTypePage
        action={<button type="button">New Snippet</button>}
        itemType={itemType}
        items={items}
      />,
    );

    assert.match(html, /Snippets/);
    assert.match(html, /1 saved item/);
    assert.match(html, /New Snippet/);
    assert.match(html, /md:grid-cols-2/);
    assert.match(html, /xl:grid-cols-3/);
    assert.match(html, /border-l-4/);
    assert.match(html, /border-l-blue-500/);
    assert.match(html, /useDebounce Hook/);
    assert.match(html, /type="button"/);
    assert.doesNotMatch(html, /href="\/items\/snippets\/item-use-debounce-hook"/);
  });

  it("wires creatable type pages to a preselected create dialog and skips file/image pages", async () => {
    const itemsByTypePageSource = await readFile(
      "src/app/items/[type]/page.tsx",
      "utf8",
    );

    assert.match(itemsByTypePageSource, /getCreatableItemKind/);
    assert.match(
      itemsByTypePageSource,
      /<ItemCreateButton initialKind={createInitialKind} \/>/,
    );
    assert.match(itemsByTypePageSource, /kind === "file" \|\| kind === "image"/);
    assert.match(itemsByTypePageSource, /action={typeCreateAction}/);
  });
});
