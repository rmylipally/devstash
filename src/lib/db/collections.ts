import type { ItemKind as PrismaItemKind } from "@/generated/prisma/enums";

export type DashboardItemKind =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "file"
  | "image"
  | "link";

export interface DashboardCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  itemTypeIds: DashboardItemKind[];
  dominantItemKind: DashboardItemKind | null;
  updatedAt: string;
}

export interface DashboardCollectionStats {
  favorite: number;
  total: number;
}

export interface DashboardCollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  items: Array<{
    item: {
      kind: PrismaItemKind;
    };
  }>;
}

export interface DashboardCollectionFindManyArgs {
  orderBy: {
    updatedAt: "desc";
  };
  select: {
    description: true;
    id: true;
    isFavorite: true;
    items: {
      select: {
        item: {
          select: {
            kind: true;
          };
        };
      };
      where?: {
        item: {
          user?: {
            email: string;
          };
          userId?: string;
        };
      };
    };
    name: true;
    slug: true;
    updatedAt: true;
  };
  take: number;
  where?: {
    user?: {
      email: string;
    };
    userId?: string;
  };
}

export interface DashboardCollectionCountArgs {
  where?: {
    isFavorite?: boolean;
    user?: {
      email: string;
    };
    userId?: string;
  };
}

export interface DashboardCollectionClient {
  collection: {
    count(
      args: DashboardCollectionCountArgs,
    ): Promise<number>;
    findMany(
      args: DashboardCollectionFindManyArgs,
    ): Promise<DashboardCollectionRow[]>;
  };
}

interface GetDashboardCollectionsOptions {
  limit?: number;
  userEmail?: string;
  userId?: string;
}

const DEFAULT_COLLECTION_LIMIT = 6;

const itemKindOrder: DashboardItemKind[] = [
  "snippet",
  "prompt",
  "note",
  "command",
  "file",
  "image",
  "link",
];

const dashboardItemKindByPrismaKind: Record<
  PrismaItemKind,
  DashboardItemKind
> = {
  COMMAND: "command",
  FILE: "file",
  IMAGE: "image",
  LINK: "link",
  NOTE: "note",
  PROMPT: "prompt",
  SNIPPET: "snippet",
};

async function getDefaultCollectionClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as DashboardCollectionClient;
}

function getKindUsage(itemKinds: DashboardItemKind[]) {
  return itemKinds.reduce<Map<DashboardItemKind, number>>((counts, kind) => {
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
    return counts;
  }, new Map());
}

function sortKindsByUsage(
  firstKind: DashboardItemKind,
  secondKind: DashboardItemKind,
  counts: Map<DashboardItemKind, number>,
) {
  const usageDifference =
    (counts.get(secondKind) ?? 0) - (counts.get(firstKind) ?? 0);

  if (usageDifference !== 0) {
    return usageDifference;
  }

  return itemKindOrder.indexOf(firstKind) - itemKindOrder.indexOf(secondKind);
}

function getItemTypesByUsage(itemKinds: DashboardItemKind[]) {
  const counts = getKindUsage(itemKinds);

  return [...new Set(itemKinds)].sort((firstKind, secondKind) =>
    sortKindsByUsage(firstKind, secondKind, counts),
  );
}

function getDominantItemKind(itemKinds: DashboardItemKind[]) {
  return getItemTypesByUsage(itemKinds)[0] ?? null;
}

function getCollectionWhere({
  userEmail,
  userId,
}: Pick<GetDashboardCollectionsOptions, "userEmail" | "userId">) {
  if (userId) {
    return { userId };
  }

  return userEmail ? { user: { email: userEmail } } : undefined;
}

function getCollectionItemsWhere({
  userEmail,
  userId,
}: Pick<GetDashboardCollectionsOptions, "userEmail" | "userId">) {
  if (userId) {
    return { item: { userId } };
  }

  return userEmail ? { item: { user: { email: userEmail } } } : undefined;
}

function getFindManyArgs(
  options: GetDashboardCollectionsOptions,
): DashboardCollectionFindManyArgs {
  const itemWhere = getCollectionItemsWhere(options);
  const where = getCollectionWhere(options);

  return {
    orderBy: { updatedAt: "desc" },
    select: {
      description: true,
      id: true,
      isFavorite: true,
      items: {
        select: {
          item: {
            select: {
              kind: true,
            },
          },
        },
        ...(itemWhere ? { where: itemWhere } : {}),
      },
      name: true,
      slug: true,
      updatedAt: true,
    },
    take: options.limit ?? DEFAULT_COLLECTION_LIMIT,
    ...(where ? { where } : {}),
  };
}

export function toDashboardCollection(
  collection: DashboardCollectionRow,
): DashboardCollection {
  const itemKinds = collection.items.map(
    ({ item }) => dashboardItemKindByPrismaKind[item.kind],
  );

  return {
    description: collection.description ?? "No description yet.",
    dominantItemKind: getDominantItemKind(itemKinds),
    id: collection.id,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    itemTypeIds: getItemTypesByUsage(itemKinds),
    name: collection.name,
    slug: collection.slug,
    updatedAt: collection.updatedAt.toISOString(),
  };
}

export async function getDashboardCollections(
  options: GetDashboardCollectionsOptions = {},
  client?: DashboardCollectionClient,
) {
  const collectionClient = client ?? (await getDefaultCollectionClient());
  const collections = await collectionClient.collection.findMany(
    getFindManyArgs(options),
  );

  return collections.map(toDashboardCollection);
}

export async function getDashboardCollectionStats(
  options: Pick<GetDashboardCollectionsOptions, "userEmail" | "userId"> = {},
  client?: DashboardCollectionClient,
): Promise<DashboardCollectionStats> {
  const collectionClient = client ?? (await getDefaultCollectionClient());
  const where = getCollectionWhere(options);
  const favoriteWhere = {
    ...(where ?? {}),
    isFavorite: true,
  };
  const [total, favorite] = await Promise.all([
    collectionClient.collection.count(where ? { where } : {}),
    collectionClient.collection.count({ where: favoriteWhere }),
  ]);

  return {
    favorite,
    total,
  };
}
