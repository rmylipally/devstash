import "dotenv/config";

import assert from "node:assert/strict";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  collectionSeeds,
  demoUserSeed,
  itemSeeds,
  systemItemTypeSeeds,
} from "../prisma/seed-data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to test the database connection.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface CountSummary {
  users: number;
  collections: number;
  items: number;
  tags: number;
  collectionItems: number;
}

interface DemoSummary {
  collections: number;
  expectedCollections: number;
  items: number;
  expectedItems: number;
  tags: number;
  expectedTags: number;
  collectionItems: number;
  expectedCollectionItems: number;
}

interface CollectionRow {
  collection: string;
  slug: string;
  items: number;
  kinds: string;
  favorite: boolean;
}

interface ItemRow {
  title: string;
  kind: string;
  collection: string;
  tags: string;
  lastViewed: string;
}

interface LinkRow {
  title: string;
  collection: string;
  url: string;
}

function formatDate(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "never";
}

function expectedKindCounts() {
  return itemSeeds.reduce<Record<string, number>>((counts, item) => {
    counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    return counts;
  }, {});
}

async function main() {
  const demoUser = await prisma.user.findUnique({
    where: { email: demoUserSeed.email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      passwordHash: true,
      plan: true,
    },
  });

  if (!demoUser) {
    throw new Error(
      `Demo user ${demoUserSeed.email} was not found. Run npm run db:seed first.`,
    );
  }

  const expectedCollectionSlugs = collectionSeeds.map(
    (collection) => collection.slug,
  );
  const expectedItemIds = itemSeeds.map((item) => item.id);
  const expectedTagCount = new Set(itemSeeds.flatMap((item) => item.tags)).size;

  const [
    databaseCounts,
    demoCounts,
    demoKindCounts,
    demoCollections,
    recentItems,
    linkItems,
  ] = await Promise.all([
    Promise.all([
      prisma.user.count(),
      prisma.collection.count(),
      prisma.item.count(),
      prisma.tag.count(),
      prisma.collectionItem.count(),
    ]),
    Promise.all([
      prisma.collection.count({
        where: {
          slug: { in: expectedCollectionSlugs },
          userId: demoUser.id,
        },
      }),
      prisma.item.count({
        where: {
          id: { in: expectedItemIds },
          userId: demoUser.id,
        },
      }),
      prisma.tag.count({ where: { userId: demoUser.id } }),
      prisma.collectionItem.count({
        where: {
          collection: { userId: demoUser.id },
          item: { userId: demoUser.id },
        },
      }),
    ]),
    prisma.item.groupBy({
      by: ["kind"],
      where: {
        id: { in: expectedItemIds },
        userId: demoUser.id,
      },
      _count: { _all: true },
      orderBy: { kind: "asc" },
    }),
    prisma.collection.findMany({
      orderBy: { name: "asc" },
      select: {
        isFavorite: true,
        items: {
          select: {
            item: {
              select: {
                kind: true,
              },
            },
          },
          where: {
            item: { userId: demoUser.id },
          },
        },
        name: true,
        slug: true,
      },
      where: {
        slug: { in: expectedCollectionSlugs },
        userId: demoUser.id,
      },
    }),
    prisma.item.findMany({
      orderBy: { lastViewedAt: "desc" },
      select: {
        collections: {
          select: {
            collection: {
              select: {
                name: true,
              },
            },
          },
          where: {
            collection: { userId: demoUser.id },
          },
        },
        kind: true,
        lastViewedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        title: true,
      },
      take: 10,
      where: {
        id: { in: expectedItemIds },
        userId: demoUser.id,
      },
    }),
    prisma.item.findMany({
      orderBy: { title: "asc" },
      select: {
        collections: {
          select: {
            collection: {
              select: {
                name: true,
              },
            },
          },
          where: {
            collection: { userId: demoUser.id },
          },
        },
        sourceUrl: true,
        title: true,
      },
      where: {
        contentKind: "URL",
        id: { in: expectedItemIds },
        userId: demoUser.id,
      },
    }),
  ]);

  const [
    userCount,
    collectionCount,
    itemCount,
    tagCount,
    collectionItemCount,
  ] = databaseCounts;
  const [
    demoCollectionCount,
    demoItemCount,
    demoTagCount,
    demoCollectionItemCount,
  ] = demoCounts;

  assert.equal(demoCollectionCount, collectionSeeds.length);
  assert.equal(demoItemCount, itemSeeds.length);
  assert.equal(demoTagCount, expectedTagCount);
  assert.equal(demoCollectionItemCount, itemSeeds.length);
  assert.ok(demoUser.passwordHash, "Demo user password hash is missing.");
  assert.ok(demoUser.emailVerified, "Demo user emailVerified is missing.");
  assert.deepEqual(
    Object.fromEntries(
      demoKindCounts.map((kindCount) => [
        kindCount.kind,
        kindCount._count._all,
      ]),
    ),
    expectedKindCounts(),
  );

  const countSummary: CountSummary = {
    users: userCount,
    collections: collectionCount,
    items: itemCount,
    tags: tagCount,
    collectionItems: collectionItemCount,
  };

  const demoSummary: DemoSummary = {
    collections: demoCollectionCount,
    expectedCollections: collectionSeeds.length,
    items: demoItemCount,
    expectedItems: itemSeeds.length,
    tags: demoTagCount,
    expectedTags: expectedTagCount,
    collectionItems: demoCollectionItemCount,
    expectedCollectionItems: itemSeeds.length,
  };

  const collectionRows: CollectionRow[] = demoCollections.map((collection) => {
    const kinds = [...new Set(collection.items.map(({ item }) => item.kind))];

    return {
      collection: collection.name,
      favorite: collection.isFavorite,
      items: collection.items.length,
      kinds: kinds.join(", "),
      slug: collection.slug,
    };
  });

  const itemRows: ItemRow[] = recentItems.map((item) => ({
    collection:
      item.collections.map(({ collection }) => collection.name).join(", ") ||
      "Unassigned",
    kind: item.kind,
    lastViewed: formatDate(item.lastViewedAt),
    tags: item.tags.map(({ tag }) => tag.name).join(", "),
    title: item.title,
  }));

  const linkRows: LinkRow[] = linkItems.map((item) => ({
    collection:
      item.collections.map(({ collection }) => collection.name).join(", ") ||
      "Unassigned",
    title: item.title,
    url: item.sourceUrl ?? "",
  }));

  console.log("Database connection OK");
  console.log("Demo seed data OK");
  console.log({
    email: demoUser.email,
    emailVerified: formatDate(demoUser.emailVerified),
    name: demoUser.name,
    passwordHash: "set",
    plan: demoUser.plan,
  });

  console.log("\nDatabase totals");
  console.table([countSummary]);

  console.log("\nDemo seed totals");
  console.table([demoSummary]);

  console.log("\nSystem item type definitions");
  console.table(
    systemItemTypeSeeds.map(({ color, icon, isSystem, name }) => ({
      color,
      icon,
      isSystem,
      name,
    })),
  );

  console.log("\nDemo collections");
  console.table(collectionRows);

  console.log("\nRecent demo items");
  console.table(itemRows);

  console.log("\nDemo links");
  console.table(linkRows);
}

main()
  .catch((error) => {
    console.error("Database test failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
