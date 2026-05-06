import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";

import { ItemTypePage } from "../src/components/items/ItemTypePage";
import type { DashboardItem, DashboardItemType } from "../src/lib/db/items";

const imageItemType: DashboardItemType = {
  color: "#ec4899",
  count: 1,
  icon: "Image",
  id: "image",
  isPro: true,
  label: "Image",
  pluralLabel: "Images",
  slug: "images",
};

const imageItems: DashboardItem[] = [
  {
    description: "Architecture diagram export.",
    fileSizeBytes: 524288,
    id: "item-architecture-diagram",
    isFavorite: false,
    isPinned: true,
    kind: "image",
    lastViewedAt: "2026-05-05T15:30:00.000Z",
    originalFileName: "architecture-diagram.png",
    tags: ["diagram", "architecture"],
    title: "Architecture Diagram",
    uploadedAt: "2026-05-05T14:00:00.000Z",
  },
];

describe("image gallery UI", () => {
  it("renders image items as thumbnail gallery cards", () => {
    const html = renderToStaticMarkup(
      createElement(ItemTypePage, {
        itemType: imageItemType,
        items: imageItems,
      }),
    );

    assert.match(html, /Images/);
    assert.match(html, /1 saved item/);
    assert.match(html, /md:grid-cols-3/);
    assert.match(html, /aspect-video/);
    assert.match(html, /object-cover/);
    assert.match(html, /group-hover:scale-105/);
    assert.match(html, /duration-300/);
    assert.match(html, /\/api\/items\/item-architecture-diagram\/download/);
    assert.match(html, /Architecture Diagram/);
    assert.doesNotMatch(html, /border-l-pink-500/);
  });
});
