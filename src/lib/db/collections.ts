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

export interface DashboardCollectionCreateArgs {
  data: {
    description: string | null;
    name: string;
    slug: string;
    userId: string;
  };
  select: DashboardCollectionSelect;
}

export interface DashboardCollectionFindUniqueArgs {
  select: {
    id: true;
  };
  where: {
    userId_slug: {
      slug: string;
      userId: string;
    };
  };
}

interface DashboardCollectionSelect {
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
    create?(
      args: DashboardCollectionCreateArgs,
    ): Promise<DashboardCollectionRow>;
    findMany(
      args: DashboardCollectionFindManyArgs,
    ): Promise<DashboardCollectionRow[]>;
    findUnique?(
      args: DashboardCollectionFindUniqueArgs,
    ): Promise<{ id: string } | null>;
  };
}

interface GetDashboardCollectionsOptions {
  limit?: number;
  userEmail?: string;
  userId?: string;
}

interface CreateCollectionOptions {
  data: {
    description?: string | null;
    name: string;
  };
  userId: string;
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

const dashboardCollectionSelect: DashboardCollectionSelect = {
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
  },
  name: true,
  slug: true,
  updatedAt: true,
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
      ...dashboardCollectionSelect,
      items: {
        ...dashboardCollectionSelect.items,
        ...(itemWhere ? { where: itemWhere } : {}),
      },
    },
    take: options.limit ?? DEFAULT_COLLECTION_LIMIT,
    ...(where ? { where } : {}),
  };
}

function getNullableValue(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  return trimmedValue ? trimmedValue : null;
}

function slugifyCollectionName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "collection"
  );
}

async function getUniqueCollectionSlug(
  name: string,
  userId: string,
  collectionClient: DashboardCollectionClient,
) {
  const baseSlug = slugifyCollectionName(name);
  let nextSlug = baseSlug;
  let suffix = 2;

  while (collectionClient.collection.findUnique) {
    const existingCollection = await collectionClient.collection.findUnique({
      select: { id: true },
      where: {
        userId_slug: {
          slug: nextSlug,
          userId,
        },
      },
    });

    if (!existingCollection) {
      return nextSlug;
    }

    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextSlug;
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

export async function createCollection(
  options: CreateCollectionOptions,
  client?: DashboardCollectionClient,
): Promise<DashboardCollection> {
  const collectionClient = client ?? (await getDefaultCollectionClient());

  if (!collectionClient.collection.create) {
    throw new Error("Collection create client is not available.");
  }

  const name = options.data.name.trim();
  const description = getNullableValue(options.data.description);
  const slug = await getUniqueCollectionSlug(
    name,
    options.userId,
    collectionClient,
  );
  const collection = await collectionClient.collection.create({
    data: {
      description,
      name,
      slug,
      userId: options.userId,
    },
    select: dashboardCollectionSelect,
  });

  return toDashboardCollection(collection);
}
