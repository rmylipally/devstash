import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to test the database connection.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [userCount, collectionCount, itemCount, tagCount] = await Promise.all([
    prisma.user.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.tag.count(),
  ]);

  const recentItems = await prisma.item.findMany({
    orderBy: { lastViewedAt: "desc" },
    select: {
      id: true,
      kind: true,
      title: true,
    },
    take: 5,
  });

  console.log("Database connection OK");
  console.log({
    collections: collectionCount,
    items: itemCount,
    tags: tagCount,
    users: userCount,
  });
  console.table(recentItems);
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
