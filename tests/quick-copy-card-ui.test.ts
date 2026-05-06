import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";

import { ItemTypePage } from "../src/components/items/ItemTypePage";
import type { DashboardItem, DashboardItemType } from "../src/lib/db/items";

const snippetItemType: DashboardItemType = {
  color: "#3b82f6",
  count: 1,
  icon: "Code",
  id: "snippet",
  isPro: false,
  label: "Snippet",
  pluralLabel: "Snippets",
  slug: "snippets",
};

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

const baseItem: DashboardItem = {
  description: "Reusable saved item.",
  fileSizeBytes: null,
  id: "item-copy-target",
  isFavorite: false,
  isPinned: false,
  kind: "snippet",
  lastViewedAt: "2026-05-06T12:00:00.000Z",
  originalFileName: null,
  tags: ["copy"],
  title: "Copy Target",
  uploadedAt: "2026-05-06T11:00:00.000Z",
};

describe("quick copy card action", () => {
  it("renders quick copy actions on item cards, image cards, and file rows", () => {
    const snippetHtml = renderToStaticMarkup(
      createElement(ItemTypePage, {
        itemType: snippetItemType,
        items: [baseItem],
      }),
    );
    const imageHtml = renderToStaticMarkup(
      createElement(ItemTypePage, {
        itemType: imageItemType,
        items: [{ ...baseItem, kind: "image" }],
      }),
    );
    const fileHtml = renderToStaticMarkup(
      createElement(ItemTypePage, {
        itemType: fileItemType,
        items: [
          {
            ...baseItem,
            fileSizeBytes: 2048,
            kind: "file",
            originalFileName: "copy-target.pdf",
          },
        ],
      }),
    );

    assert.match(snippetHtml, /aria-label="Copy Copy Target"/);
    assert.match(imageHtml, /aria-label="Copy Copy Target"/);
    assert.match(fileHtml, /aria-label="Copy Copy Target"/);
  });

  it("copies item detail content without opening the card drawer", async () => {
    const itemDrawerSource = await readFile(
      "src/components/items/ItemDrawerProvider.tsx",
      "utf8",
    );

    assert.match(itemDrawerSource, /function QuickCopyButton/);
    assert.match(itemDrawerSource, /event\.stopPropagation\(\)/);
    assert.match(itemDrawerSource, /fetch\(`\/api\/items\/\$\{item\.id\}`/);
    assert.match(itemDrawerSource, /navigator\.clipboard\.writeText/);
    assert.match(itemDrawerSource, /payload\.data\.content \?\? payload\.data\.sourceUrl \?\? item\.title/);
    assert.doesNotMatch(itemDrawerSource, /role="button"/);

    const fileListRowSource = itemDrawerSource.match(
      /export function FileListRow\(\{ item \}: \{ item: DashboardItem \}\) \{[\s\S]*?function FileTypeIcon/,
    )?.[0];

    assert.ok(fileListRowSource);
    assert.doesNotMatch(fileListRowSource, /<button[\s\S]*?<a[\s\S]*?<\/button>/);
  });
});
