import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  collectionSeeds,
  demoUserSeed,
  itemSeeds,
  systemItemTypeSeeds,
} from "./seed-data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TAG_COLORS: Record<string, string> = {
  ai: "#8b5cf6",
  branches: "#f97316",
  cleanup: "#f97316",
  components: "#3b82f6",
  css: "#10b981",
  database: "#6b7280",
  debugging: "#f97316",
  deploy: "#f97316",
  docker: "#0ea5e9",
  docs: "#10b981",
  git: "#f97316",
  hooks: "#3b82f6",
  icons: "#ec4899",
  npm: "#ef4444",
  patterns: "#3b82f6",
  prisma: "#6b7280",
  react: "#3b82f6",
  reference: "#10b981",
  tailwind: "#10b981",
  typescript: "#3b82f6",
  ui: "#ec4899",
  utility: "#6b7280",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const passwordHash = await hash(demoUserSeed.password, 12);
  const seededAt = new Date();

  await prisma.$transaction(async (tx) => {
    for (const itemType of systemItemTypeSeeds) {
      await tx.itemType.upsert({
        where: { id: itemType.name },
        update: {
          color: itemType.color,
          icon: itemType.icon,
          isPro: itemType.isPro,
          isSystem: itemType.isSystem,
          kind: itemType.kind,
          label: itemType.label,
          pluralLabel: itemType.pluralLabel,
          slug: itemType.slug,
          sortOrder: itemType.sortOrder,
        },
        create: {
          color: itemType.color,
          icon: itemType.icon,
          id: itemType.name,
          isPro: itemType.isPro,
          isSystem: itemType.isSystem,
          kind: itemType.kind,
          label: itemType.label,
          pluralLabel: itemType.pluralLabel,
          slug: itemType.slug,
          sortOrder: itemType.sortOrder,
        },
      });
    }

    const user = await tx.user.upsert({
      where: { email: demoUserSeed.email },
      update: {
        emailVerified: seededAt,
        name: demoUserSeed.name,
        passwordHash,
        plan: demoUserSeed.plan,
      },
      create: {
        email: demoUserSeed.email,
        emailVerified: seededAt,
        name: demoUserSeed.name,
        passwordHash,
        plan: demoUserSeed.plan,
      },
      select: { id: true },
    });

    const collectionIdsBySlug = new Map<string, string>();

    for (const collection of collectionSeeds) {
      const savedCollection = await tx.collection.upsert({
        where: { id: collection.id },
        update: {
          color: collection.color,
          defaultKind: collection.defaultKind,
          description: collection.description,
          icon: collection.icon,
          isFavorite: collection.isFavorite,
          name: collection.name,
          slug: collection.slug,
          userId: user.id,
        },
        create: {
          color: collection.color,
          defaultKind: collection.defaultKind,
          description: collection.description,
          icon: collection.icon,
          id: collection.id,
          isFavorite: collection.isFavorite,
          name: collection.name,
          slug: collection.slug,
          userId: user.id,
        },
        select: { id: true, slug: true },
      });

      collectionIdsBySlug.set(savedCollection.slug, savedCollection.id);
    }

    const uniqueTags = new Set(itemSeeds.flatMap((item) => item.tags));

    for (const tag of uniqueTags) {
      const slug = slugify(tag);

      await tx.tag.upsert({
        where: {
          userId_slug: {
            userId: user.id,
            slug,
          },
        },
        update: {
          color: TAG_COLORS[slug] ?? "#6b7280",
          name: tag,
        },
        create: {
          color: TAG_COLORS[slug] ?? "#6b7280",
          name: tag,
          slug,
          userId: user.id,
        },
      });
    }

    for (const item of itemSeeds) {
      const collectionId = collectionIdsBySlug.get(item.collectionSlug);

      if (!collectionId) {
        throw new Error(`Missing collection for slug: ${item.collectionSlug}`);
      }

      await tx.item.upsert({
        where: { id: item.id },
        update: {
          content: item.content,
          contentKind: item.contentKind,
          createdAt: new Date(item.createdAt),
          description: item.description,
          isFavorite: item.isFavorite,
          isPinned: item.isPinned,
          kind: item.kind,
          language: item.language,
          lastViewedAt: new Date(item.lastViewedAt),
          metadata: {
            seed: true,
            systemItemType: item.kind.toLowerCase(),
          },
          sourceUrl: item.sourceUrl,
          title: item.title,
          updatedAt: new Date(item.updatedAt),
          userId: user.id,
        },
        create: {
          content: item.content,
          contentKind: item.contentKind,
          createdAt: new Date(item.createdAt),
          description: item.description,
          id: item.id,
          isFavorite: item.isFavorite,
          isPinned: item.isPinned,
          kind: item.kind,
          language: item.language,
          lastViewedAt: new Date(item.lastViewedAt),
          metadata: {
            seed: true,
            systemItemType: item.kind.toLowerCase(),
          },
          sourceUrl: item.sourceUrl,
          title: item.title,
          updatedAt: new Date(item.updatedAt),
          userId: user.id,
        },
      });

      await tx.collectionItem.deleteMany({
        where: { itemId: item.id },
      });

      await tx.collectionItem.create({
        data: {
          collectionId,
          itemId: item.id,
        },
      });

      await tx.itemTag.deleteMany({
        where: { itemId: item.id },
      });

      for (const tag of item.tags) {
        const savedTag = await tx.tag.findUniqueOrThrow({
          where: {
            userId_slug: {
              userId: user.id,
              slug: slugify(tag),
            },
          },
          select: { id: true },
        });

        await tx.itemTag.create({
          data: {
            itemId: item.id,
            tagId: savedTag.id,
          },
        });
      }
    }

    console.log(
      [
        `Seeded ${collectionSeeds.length} collections`,
        `${itemSeeds.length} items`,
        `${uniqueTags.size} tags`,
        `${systemItemTypeSeeds.length} system item type definitions`,
      ].join(", "),
    );
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
