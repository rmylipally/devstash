import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  collections,
  currentUser,
  items,
  type ContentKind,
  type ItemKind,
  type PlanTier,
} from "../src/lib/mock-data";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const itemKindMap: Record<ItemKind, Uppercase<ItemKind>> = {
  snippet: "SNIPPET",
  prompt: "PROMPT",
  note: "NOTE",
  command: "COMMAND",
  file: "FILE",
  image: "IMAGE",
  link: "LINK",
};

const contentKindMap: Record<ContentKind, Uppercase<ContentKind>> = {
  text: "TEXT",
  file: "FILE",
  url: "URL",
};

const planTierMap: Record<PlanTier, Uppercase<PlanTier>> = {
  free: "FREE",
  pro: "PRO",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  await prisma.user.upsert({
    where: { id: currentUser.id },
    update: {
      email: currentUser.email,
      image: currentUser.imageUrl,
      name: currentUser.name,
      plan: planTierMap[currentUser.plan],
    },
    create: {
      id: currentUser.id,
      email: currentUser.email,
      image: currentUser.imageUrl,
      name: currentUser.name,
      plan: planTierMap[currentUser.plan],
    },
  });

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: {
        userId_slug: {
          userId: currentUser.id,
          slug: collection.slug,
        },
      },
      update: {
        color: collection.color,
        description: collection.description,
        icon: collection.icon,
        isFavorite: collection.isFavorite,
        name: collection.name,
        updatedAt: new Date(collection.updatedAt),
      },
      create: {
        id: collection.id,
        color: collection.color,
        description: collection.description,
        icon: collection.icon,
        isFavorite: collection.isFavorite,
        name: collection.name,
        slug: collection.slug,
        updatedAt: new Date(collection.updatedAt),
        userId: currentUser.id,
      },
    });
  }

  const uniqueTags = new Set(items.flatMap((item) => item.tags));

  for (const tag of uniqueTags) {
    await prisma.tag.upsert({
      where: {
        userId_slug: {
          userId: currentUser.id,
          slug: slugify(tag),
        },
      },
      update: {
        name: tag,
      },
      create: {
        name: tag,
        slug: slugify(tag),
        userId: currentUser.id,
      },
    });
  }

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        content: item.content,
        contentKind: contentKindMap[item.contentKind],
        createdAt: new Date(item.createdAt),
        description: item.description,
        isFavorite: item.isFavorite,
        isPinned: item.isPinned,
        kind: itemKindMap[item.kind],
        language: item.language,
        lastViewedAt: new Date(item.lastViewedAt),
        sourceUrl: item.sourceUrl,
        title: item.title,
        updatedAt: new Date(item.updatedAt),
      },
      create: {
        id: item.id,
        content: item.content,
        contentKind: contentKindMap[item.contentKind],
        createdAt: new Date(item.createdAt),
        description: item.description,
        isFavorite: item.isFavorite,
        isPinned: item.isPinned,
        kind: itemKindMap[item.kind],
        language: item.language,
        lastViewedAt: new Date(item.lastViewedAt),
        sourceUrl: item.sourceUrl,
        title: item.title,
        updatedAt: new Date(item.updatedAt),
        userId: currentUser.id,
      },
    });
  }

  for (const item of items) {
    for (const collectionId of item.collectionIds) {
      await prisma.collectionItem.upsert({
        where: {
          collectionId_itemId: {
            collectionId,
            itemId: item.id,
          },
        },
        update: {},
        create: {
          collectionId,
          itemId: item.id,
        },
      });
    }

    for (const tag of item.tags) {
      const savedTag = await prisma.tag.findUniqueOrThrow({
        where: {
          userId_slug: {
            userId: currentUser.id,
            slug: slugify(tag),
          },
        },
        select: { id: true },
      });

      await prisma.itemTag.upsert({
        where: {
          itemId_tagId: {
            itemId: item.id,
            tagId: savedTag.id,
          },
        },
        update: {},
        create: {
          itemId: item.id,
          tagId: savedTag.id,
        },
      });
    }
  }

  console.log(
    `Seeded ${items.length} items, ${collections.length} collections, and ${uniqueTags.size} tags.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
