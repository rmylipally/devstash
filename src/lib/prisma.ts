import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaClient = globalForPrisma.prisma;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
  });
}

export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = createPrismaClient();

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClient;
    }
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value: unknown = Reflect.get(client, prop);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
