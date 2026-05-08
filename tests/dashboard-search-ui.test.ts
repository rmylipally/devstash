import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "vitest";

import { DashboardFrame } from "../src/components/dashboard/DashboardFrame";
import { CommandPaletteContextProvider } from "../src/components/search/CommandPaletteContext";
import type { DashboardCollection } from "../src/lib/db/collections";
import type { DashboardItemType } from "../src/lib/db/items";

const currentUser = {
  email: "demo@devstash.io",
  id: "user-demo",
  image: null,
  name: "Demo User",
  plan: "free" as const,
};

const itemTypes: DashboardItemType[] = [
  {
    color: "#3b82f6",
    count: 7,
    icon: "Code",
    id: "snippet",
    isPro: false,
    label: "Snippet",
    pluralLabel: "Snippets",
    slug: "snippets",
  },
];

const collection: DashboardCollection = {
  description: "Reusable React patterns",
  dominantItemKind: "snippet",
  id: "collection-react-patterns",
  isFavorite: true,
  itemCount: 7,
  itemTypeIds: ["snippet"],
  name: "React Patterns",
  slug: "react-patterns",
  updatedAt: "2026-04-25T14:30:00.000Z",
};

describe("dashboard search UI", () => {
  it("renders the placeholder search input as disabled until search is implemented", () => {
    const html = renderToStaticMarkup(
      createElement(
        CommandPaletteContextProvider,
        null,
        createElement(
          DashboardFrame,
          {
            currentUser,
            favoriteCollections: [collection],
            itemTypes,
            recentCollections: [collection],
          },
          createElement("div", null, "Dashboard content"),
        ),
      ),
    );

    assert.match(html, /aria-label="Open search"/);
    assert.match(html, /Search items/);
    assert.match(html, /⌘K/);
  });
});
