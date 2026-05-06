import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";

import { ItemTypePage } from "../src/components/items/ItemTypePage";
import type { DashboardItem, DashboardItemType } from "../src/lib/db/items";

const fileItemType: DashboardItemType = {
  color: "#6b7280",
  count: 1,
  icon: "File",
  id: "file",
  isPro: true,
  label: "File",
  pluralLabel: "Files",
  slug: "files",
};

const fileItems: DashboardItem[] = [
  {
    description: "Launch checklist for production releases.",
    fileSizeBytes: 153600,
    id: "item-launch-checklist",
    isFavorite: false,
    isPinned: false,
    kind: "file",
    lastViewedAt: "2026-05-04T13:00:00.000Z",
    originalFileName: "launch-checklist.pdf",
    tags: ["release", "ops"],
    title: "Launch Checklist",
    uploadedAt: "2026-05-01T12:00:00.000Z",
  },
];

describe("file list UI", () => {
  it("renders file items as single-column rows with file metadata and download actions", () => {
    const html = renderToStaticMarkup(
      createElement(ItemTypePage, {
        itemType: fileItemType,
        items: fileItems,
      }),
    );

    assert.match(html, /Files/);
    assert.match(html, /1 saved item/);
    assert.match(html, /grid-cols-1/);
    assert.doesNotMatch(html, /md:grid-cols-2/);
    assert.doesNotMatch(html, /xl:grid-cols-3/);
    assert.match(html, /hover:bg-muted\/40/);
    assert.match(html, /Launch Checklist/);
    assert.match(html, /150 KB/);
    assert.match(html, /May 1, 2026/);
    assert.match(html, /\/api\/items\/item-launch-checklist\/download/);
    assert.match(html, /Download Launch Checklist/);
    assert.match(html, /sm:flex-row/);
  });
});
