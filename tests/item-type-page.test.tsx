import assert from "node:assert/strict";
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
      <ItemTypePage itemType={itemType} items={items} />,
    );

    assert.match(html, /Snippets/);
    assert.match(html, /1 saved item/);
    assert.match(html, /md:grid-cols-2/);
    assert.match(html, /xl:grid-cols-3/);
    assert.match(html, /border-l-4/);
    assert.match(html, /border-l-blue-500/);
    assert.match(html, /useDebounce Hook/);
  });
});
