#!/usr/bin/env node

import "dotenv/config";

import { pathToFileURL } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";

import { demoUserSeed } from "../prisma/seed-data";
import { PrismaClient } from "../src/generated/prisma/client";

export const DEFAULT_KEEP_EMAIL = demoUserSeed.email;

export interface CleanupArgs {
  confirmEmail: string | null;
  execute: boolean;
  keepEmail: string;
}

interface CleanupSummary {
  accounts: number;
  aiJobs: number;
  collectionItems: number;
  collections: number;
  customTypes: number;
  itemTags: number;
  items: number;
  sessions: number;
  tags: number;
  users: number;
  verificationTokens: number;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readFlagValue(args: string[], index: number, flag: string) {
  const currentArg = args[index];
  const prefix = `${flag}=`;

  if (currentArg.startsWith(prefix)) {
    return {
      nextIndex: index,
      value: currentArg.slice(prefix.length),
    };
  }

  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return {
    nextIndex: index + 1,
    value,
  };
}

export function parseCleanupArgs(args: string[]): CleanupArgs {
  let confirmEmail: string | null = null;
  let execute = false;
  let keepEmail = DEFAULT_KEEP_EMAIL;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--execute") {
      execute = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      throw new Error(getUsage());
    }

    if (arg === "--keep-email" || arg.startsWith("--keep-email=")) {
      const result = readFlagValue(args, index, "--keep-email");
      keepEmail = normalizeEmail(result.value);
      index = result.nextIndex;
      continue;
    }

    if (arg === "--confirm" || arg.startsWith("--confirm=")) {
      const result = readFlagValue(args, index, "--confirm");
      confirmEmail = normalizeEmail(result.value);
      index = result.nextIndex;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    confirmEmail,
    execute,
    keepEmail,
  };
}

function getUsage() {
  return [
    "Usage:",
    "  node --import tsx scripts/delete-non-demo-users.ts",
    "  node --import tsx scripts/delete-non-demo-users.ts --execute --confirm=demo@devstash.io",
    "",
    "Options:",
    "  --execute              Actually delete users. Omit for dry-run mode.",
    "  --confirm=<email>      Required with --execute; must match the kept email.",
    "  --keep-email=<email>   User email to preserve. Defaults to demo@devstash.io.",
  ].join("\n");
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run cleanup.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

async function getCleanupSummary(
  prisma: PrismaClient,
  keepEmail: string,
): Promise<CleanupSummary> {
  const userWhere = { email: { not: keepEmail } };
  const userRelationWhere = { user: userWhere };
  const itemRelationWhere = { item: userRelationWhere };
  const collectionRelationWhere = { collection: userRelationWhere };

  const [
    users,
    accounts,
    sessions,
    items,
    collections,
    customTypes,
    tags,
    aiJobs,
    collectionItems,
    itemTags,
    verificationTokens,
  ] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.account.count({ where: userRelationWhere }),
    prisma.session.count({ where: userRelationWhere }),
    prisma.item.count({ where: userRelationWhere }),
    prisma.collection.count({ where: userRelationWhere }),
    prisma.customType.count({ where: userRelationWhere }),
    prisma.tag.count({ where: userRelationWhere }),
    prisma.aiJob.count({
      where: {
        OR: [userRelationWhere, itemRelationWhere],
      },
    }),
    prisma.collectionItem.count({
      where: {
        OR: [collectionRelationWhere, itemRelationWhere],
      },
    }),
    prisma.itemTag.count({
      where: {
        OR: [{ tag: userRelationWhere }, itemRelationWhere],
      },
    }),
    prisma.verificationToken.count({
      where: {
        identifier: { not: keepEmail },
      },
    }),
  ]);

  return {
    accounts,
    aiJobs,
    collectionItems,
    collections,
    customTypes,
    itemTags,
    items,
    sessions,
    tags,
    users,
    verificationTokens,
  };
}

function assertExecutionConfirmed(options: CleanupArgs) {
  if (!options.execute) {
    return;
  }

  if (options.confirmEmail !== options.keepEmail) {
    throw new Error(
      `Refusing to delete users. Re-run with --confirm=${options.keepEmail}.`,
    );
  }
}

async function deleteNonDemoUsers(prisma: PrismaClient, keepEmail: string) {
  return prisma.$transaction(async (tx) => {
    const verificationTokens = await tx.verificationToken.deleteMany({
      where: {
        identifier: { not: keepEmail },
      },
    });
    const users = await tx.user.deleteMany({
      where: {
        email: { not: keepEmail },
      },
    });

    return {
      deletedUsers: users.count,
      deletedVerificationTokens: verificationTokens.count,
    };
  });
}

function printSummary(summary: CleanupSummary, keepEmail: string) {
  console.log(`Keeping user: ${keepEmail}`);
  console.table(summary);
}

async function main() {
  const options = parseCleanupArgs(process.argv.slice(2));

  assertExecutionConfirmed(options);

  const prisma = createPrismaClient();

  try {
    const keeper = await prisma.user.findUnique({
      select: { email: true, id: true },
      where: { email: options.keepEmail },
    });

    if (!keeper) {
      throw new Error(`Kept user ${options.keepEmail} does not exist.`);
    }

    const summary = await getCleanupSummary(prisma, options.keepEmail);

    printSummary(summary, options.keepEmail);

    if (!options.execute) {
      console.log("Dry run only. No users or content were deleted.");
      console.log(
        `To delete, run: node --import tsx scripts/delete-non-demo-users.ts --execute --confirm=${options.keepEmail}`,
      );
      return;
    }

    const result = await deleteNonDemoUsers(prisma, options.keepEmail);

    console.log(
      `Deleted ${result.deletedUsers} users and ${result.deletedVerificationTokens} verification tokens. Related user content was removed by database cascades.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
