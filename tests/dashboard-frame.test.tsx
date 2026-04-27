import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { DashboardFrame } from "../src/components/dashboard/DashboardFrame";
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
  {
    color: "#8b5cf6",
    count: 5,
    icon: "Sparkles",
    id: "prompt",
    isPro: false,
    label: "Prompt",
    pluralLabel: "Prompts",
    slug: "prompts",
  },
];

const recentCollection: DashboardCollection = {
  description: "Prompt workflows for coding",
  dominantItemKind: "prompt",
  id: "collection-ai-prompts",
  isFavorite: false,
  itemCount: 5,
  itemTypeIds: ["prompt"],
  name: "AI Prompts",
  slug: "ai-prompts",
  updatedAt: "2026-04-25T14:30:00.000Z",
};

const favoriteCollection: DashboardCollection = {
  ...recentCollection,
  dominantItemKind: "snippet",
  id: "collection-react-patterns",
  isFavorite: true,
  itemCount: 7,
  itemTypeIds: ["snippet"],
  name: "React Patterns",
  slug: "react-patterns",
};

function renderDashboardFrame() {
  return renderToStaticMarkup(
    <DashboardFrame
      currentUser={currentUser}
      favoriteCollections={[favoriteCollection]}
      itemTypes={itemTypes}
      recentCollections={[recentCollection]}
    >
      <div>Dashboard content</div>
    </DashboardFrame>,
  );
}

describe("dashboard frame sidebar", () => {
  it("renders database-backed item type links and counts", () => {
    const html = renderDashboardFrame();

    assert.match(html, /href="\/items\/snippets"/);
    assert.match(html, /Snippets/);
    assert.match(html, />7</);
    assert.match(html, /href="\/items\/prompts"/);
    assert.match(html, /Prompts/);
    assert.match(html, />5</);
  });

  it("renders a view-all collections link under recent collections", () => {
    const html = renderDashboardFrame();

    assert.match(html, /href="\/collections"/);
    assert.match(html, /View all collections/);
  });

  it("keeps favorite stars and uses dominant-kind markers for recent collections", () => {
    const html = renderDashboardFrame();

    assert.match(html, /React Patterns/);
    assert.match(html, /fill-yellow-400 text-yellow-400/);
    assert.match(
      html,
      /href="\/collections\/ai-prompts"[\s\S]*bg-violet-500\/10 text-violet-400[\s\S]*AI Prompts/,
    );
  });

  it("renders the signed-in user details, profile link, and sign-out control", () => {
    const html = renderDashboardFrame();

    assert.match(html, /Demo User/);
    assert.match(html, /demo@devstash\.io/);
    assert.match(html, /href="\/profile"/);
    assert.match(html, />DU</);
    assert.match(html, /Sign out/);
  });
});
