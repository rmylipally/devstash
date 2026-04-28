import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

process.env.DATABASE_URL ??=
  "postgresql://devstash:devstash@localhost:5432/devstash";

describe("profile page", () => {
  it("fetches profile identity, usage stats, and item type breakdown for the signed-in user", async () => {
    const { getProfileData } = await import("../src/lib/db/profile");
    const userFindUniqueArgs: unknown[] = [];
    const itemCountArgs: unknown[] = [];
    const collectionCountArgs: unknown[] = [];
    const itemGroupByArgs: unknown[] = [];
    const itemTypeFindManyArgs: unknown[] = [];
    const client = {
      collection: {
        count: async (args) => {
          collectionCountArgs.push(args);
          return 4;
        },
      },
      item: {
        count: async (args) => {
          itemCountArgs.push(args);
          return 12;
        },
        groupBy: async (args) => {
          itemGroupByArgs.push(args);
          return [
            { _count: { _all: 5 }, kind: "SNIPPET" },
            { _count: { _all: 3 }, kind: "PROMPT" },
            { _count: { _all: 2 }, kind: "COMMAND" },
          ];
        },
      },
      itemType: {
        findMany: async (args) => {
          itemTypeFindManyArgs.push(args);
          return [
            {
              color: "#3b82f6",
              icon: "Code",
              id: "snippet",
              isPro: false,
              kind: "SNIPPET",
              label: "Snippet",
              pluralLabel: "Snippets",
              slug: "snippets",
            },
            {
              color: "#8b5cf6",
              icon: "Sparkles",
              id: "prompt",
              isPro: false,
              kind: "PROMPT",
              label: "Prompt",
              pluralLabel: "Prompts",
              slug: "prompts",
            },
            {
              color: "#f97316",
              icon: "Terminal",
              id: "command",
              isPro: false,
              kind: "COMMAND",
              label: "Command",
              pluralLabel: "Commands",
              slug: "commands",
            },
            {
              color: "#fde047",
              icon: "StickyNote",
              id: "note",
              isPro: false,
              kind: "NOTE",
              label: "Note",
              pluralLabel: "Notes",
              slug: "notes",
            },
          ];
        },
      },
      user: {
        findUnique: async (args) => {
          userFindUniqueArgs.push(args);
          return {
            createdAt: new Date("2026-04-24T12:30:00.000Z"),
            email: "demo@devstash.io",
            id: "user-demo",
            image: null,
            name: "Demo User",
            passwordHash: "hashed-password",
          };
        },
      },
    };

    const profileData = await getProfileData({ userId: "user-demo" }, client);

    assert.deepEqual(profileData, {
      accountCreatedAt: "2026-04-24T12:30:00.000Z",
      canChangePassword: true,
      email: "demo@devstash.io",
      id: "user-demo",
      image: null,
      itemTypes: [
        {
          color: "#3b82f6",
          count: 5,
          icon: "Code",
          id: "snippet",
          label: "Snippet",
          pluralLabel: "Snippets",
          slug: "snippets",
        },
        {
          color: "#8b5cf6",
          count: 3,
          icon: "Sparkles",
          id: "prompt",
          label: "Prompt",
          pluralLabel: "Prompts",
          slug: "prompts",
        },
        {
          color: "#f97316",
          count: 2,
          icon: "Terminal",
          id: "command",
          label: "Command",
          pluralLabel: "Commands",
          slug: "commands",
        },
        {
          color: "#fde047",
          count: 0,
          icon: "StickyNote",
          id: "note",
          label: "Note",
          pluralLabel: "Notes",
          slug: "notes",
        },
      ],
      name: "Demo User",
      stats: {
        totalCollections: 4,
        totalItems: 12,
      },
    });
    assert.deepEqual(userFindUniqueArgs, [
      {
        select: {
          createdAt: true,
          email: true,
          id: true,
          image: true,
          name: true,
          passwordHash: true,
        },
        where: { id: "user-demo" },
      },
    ]);
    assert.deepEqual(itemCountArgs, [{ where: { userId: "user-demo" } }]);
    assert.deepEqual(collectionCountArgs, [{ where: { userId: "user-demo" } }]);
    assert.deepEqual(itemGroupByArgs, [
      {
        _count: { _all: true },
        by: ["kind"],
        where: { userId: "user-demo" },
      },
    ]);
    assert.deepEqual(itemTypeFindManyArgs, [
      {
        orderBy: { sortOrder: "asc" },
        select: {
          color: true,
          icon: true,
          id: true,
          kind: true,
          label: true,
          pluralLabel: true,
          slug: true,
        },
        where: { isSystem: true },
      },
    ]);
  });

  it("does not offer password changes for OAuth-only users", async () => {
    const { getProfileData } = await import("../src/lib/db/profile");
    const client = {
      collection: {
        count: async () => 0,
      },
      item: {
        count: async () => 0,
        groupBy: async () => [],
      },
      itemType: {
        findMany: async () => [],
      },
      user: {
        findUnique: async () => ({
          createdAt: new Date("2026-04-24T12:30:00.000Z"),
          email: "oauth@devstash.io",
          id: "user-oauth",
          image: "https://avatars.githubusercontent.com/u/1?v=4",
          name: "OAuth User",
          passwordHash: null,
        }),
      },
    };

    const profileData = await getProfileData({ userId: "user-oauth" }, client);

    assert.equal(profileData?.canChangePassword, false);
  });

  it("renders account actions with change password hidden when unavailable", async () => {
    const { ProfileAccountActions } = await import(
      "../src/components/profile/ProfileAccountActions"
    );
    const emailUserHtml = renderToStaticMarkup(
      <ProfileAccountActions canChangePassword />,
    );
    const oauthUserHtml = renderToStaticMarkup(
      <ProfileAccountActions canChangePassword={false} />,
    );

    assert.match(emailUserHtml, /href="\/forgot-password"/);
    assert.match(emailUserHtml, /Change password/);
    assert.match(emailUserHtml, /Delete account/);
    assert.match(emailUserHtml, /This action cannot be undone/);
    assert.doesNotMatch(oauthUserHtml, /Change password/);
    assert.match(oauthUserHtml, /Delete account/);
  });

  it("wires the protected profile page and account delete API", async () => {
    const [profilePage, proxy, accountRoute] = await Promise.all([
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/proxy.ts", "utf8"),
      import("../src/app/api/account/route"),
    ]);

    assert.match(profilePage, /getProfileData/);
    assert.match(profilePage, /DashboardFrame/);
    assert.match(profilePage, /getDashboardCollections/);
    assert.match(profilePage, /getDashboardItemTypes/);
    assert.match(profilePage, /ProfileAccountActions/);
    assert.match(profilePage, /Account created/);
    assert.match(profilePage, /Usage stats/);
    assert.match(profilePage, /Item type breakdown/);
    assert.match(profilePage, /redirect\("\/sign-in\?callbackUrl=\/profile"\)/);
    assert.match(proxy, /"\/profile"/);
    assert.equal(typeof accountRoute.DELETE, "function");
  });
});
