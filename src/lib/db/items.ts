import type {
  ContentKind as PrismaContentKind,
  ItemKind as PrismaItemKind,
} from "@/generated/prisma/enums";

export type DashboardItemKind =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "file"
  | "image"
  | "link";

export interface DashboardItem {
  id: string;
  title: string;
  kind: DashboardItemKind;
  description: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastViewedAt: string;
}

export interface DashboardItemType {
  id: DashboardItemKind;
  label: string;
  pluralLabel: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
  isPro: boolean;
}

export interface DashboardItemStats {
  favorite: number;
  total: number;
}

export type ItemDetailContentKind = "text" | "file" | "url";

export interface ItemDetail {
  aiSummary: string | null;
  collections: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  content: string | null;
  contentKind: ItemDetailContentKind;
  createdAt: string;
  description: string | null;
  fileSizeBytes: number | null;
  id: string;
  isFavorite: boolean;
  isPinned: boolean;
  kind: DashboardItemKind;
  language: string | null;
  mimeType: string | null;
  originalFileName: string | null;
  sourceUrl: string | null;
  storageKey: string | null;
  tags: string[];
  title: string;
  updatedAt: string;
}

export interface DashboardItemRow {
  id: string;
  title: string;
  kind: PrismaItemKind;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastViewedAt: Date | null;
  updatedAt: Date;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
}

export interface DashboardItemWhere {
  isFavorite?: boolean;
  isPinned?: boolean;
  kind?: PrismaItemKind;
  lastViewedAt?: {
    not: null;
  };
  user?: {
    email: string;
  };
  userId?: string;
}

export interface DashboardItemFindManyArgs {
  orderBy: {
    lastViewedAt: "desc";
  };
  select: {
    description: true;
    id: true;
    isFavorite: true;
    isPinned: true;
    kind: true;
    lastViewedAt: true;
    tags: {
      select: {
        tag: {
          select: {
            name: true;
          };
        };
      };
    };
    title: true;
    updatedAt: true;
  };
  take?: number;
  where?: DashboardItemWhere;
}

export interface DashboardItemCountArgs {
  where?: DashboardItemWhere;
}

export interface DashboardItemGroupByArgs {
  _count: {
    _all: true;
  };
  by: ["kind"];
  where?: DashboardItemWhere;
}

export interface DashboardItemGroupByRow {
  _count: {
    _all: number;
  };
  kind: PrismaItemKind;
}

export interface DashboardItemTypeRow {
  color: string;
  icon: string;
  id: string;
  isPro: boolean;
  kind: PrismaItemKind;
  label: string;
  pluralLabel: string;
  slug: string;
}

export interface DashboardItemTypeFindManyArgs {
  orderBy: {
    sortOrder: "asc";
  };
  select: {
    color: true;
    icon: true;
    id: true;
    isPro: true;
    kind: true;
    label: true;
    pluralLabel: true;
    slug: true;
  };
  where: {
    isSystem: true;
  };
}

export interface ItemDetailRow {
  aiSummary: string | null;
  collections: Array<{
    collection: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  content: string | null;
  contentKind: PrismaContentKind;
  createdAt: Date;
  description: string | null;
  fileSizeBytes: number | null;
  id: string;
  isFavorite: boolean;
  isPinned: boolean;
  kind: PrismaItemKind;
  language: string | null;
  mimeType: string | null;
  originalFileName: string | null;
  sourceUrl: string | null;
  storageKey: string | null;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
  title: string;
  updatedAt: Date;
}

export interface ItemDetailFindFirstArgs {
  select: {
    aiSummary: true;
    collections: {
      select: {
        collection: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
      };
    };
    content: true;
    contentKind: true;
    createdAt: true;
    description: true;
    fileSizeBytes: true;
    id: true;
    isFavorite: true;
    isPinned: true;
    kind: true;
    language: true;
    mimeType: true;
    originalFileName: true;
    sourceUrl: true;
    storageKey: true;
    tags: {
      select: {
        tag: {
          select: {
            name: true;
          };
        };
      };
    };
    title: true;
    updatedAt: true;
  };
  where: {
    id: string;
    userId: string;
  };
}

export interface DashboardItemClient {
  item: {
    count(args: DashboardItemCountArgs): Promise<number>;
    findMany(args: DashboardItemFindManyArgs): Promise<DashboardItemRow[]>;
    groupBy?(
      args: DashboardItemGroupByArgs,
    ): Promise<DashboardItemGroupByRow[]>;
  };
  itemType?: {
    findMany(
      args: DashboardItemTypeFindManyArgs,
    ): Promise<DashboardItemTypeRow[]>;
  };
}

export interface ItemDetailClient {
  item: {
    findFirst(args: ItemDetailFindFirstArgs): Promise<ItemDetailRow | null>;
  };
}

interface GetDashboardItemsOptions {
  limit?: number;
  userEmail?: string;
  userId?: string;
}

interface GetDashboardItemsByTypeOptions extends GetDashboardItemsOptions {
  kind: DashboardItemKind;
}

interface GetItemDetailOptions {
  itemId: string;
  userId: string;
}

const DEFAULT_RECENT_ITEM_LIMIT = 10;

const dashboardItemKindByPrismaKind: Record<PrismaItemKind, DashboardItemKind> =
  {
    COMMAND: "command",
    FILE: "file",
    IMAGE: "image",
    LINK: "link",
    NOTE: "note",
    PROMPT: "prompt",
    SNIPPET: "snippet",
  };

const prismaItemKindByDashboardKind: Record<DashboardItemKind, PrismaItemKind> =
  {
    command: "COMMAND",
    file: "FILE",
    image: "IMAGE",
    link: "LINK",
    note: "NOTE",
    prompt: "PROMPT",
    snippet: "SNIPPET",
  };

const itemDetailContentKindByPrismaContentKind: Record<
  PrismaContentKind,
  ItemDetailContentKind
> = {
  FILE: "file",
  TEXT: "text",
  URL: "url",
};

const dashboardItemTypeSelect: DashboardItemTypeFindManyArgs["select"] = {
  color: true,
  icon: true,
  id: true,
  isPro: true,
  kind: true,
  label: true,
  pluralLabel: true,
  slug: true,
};

const dashboardItemSelect: DashboardItemFindManyArgs["select"] = {
  description: true,
  id: true,
  isFavorite: true,
  isPinned: true,
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
  updatedAt: true,
};

const itemDetailSelect: ItemDetailFindFirstArgs["select"] = {
  aiSummary: true,
  collections: {
    select: {
      collection: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  content: true,
  contentKind: true,
  createdAt: true,
  description: true,
  fileSizeBytes: true,
  id: true,
  isFavorite: true,
  isPinned: true,
  kind: true,
  language: true,
  mimeType: true,
  originalFileName: true,
  sourceUrl: true,
  storageKey: true,
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
  updatedAt: true,
};

async function getDefaultItemClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as DashboardItemClient;
}

async function getDefaultItemDetailClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as ItemDetailClient;
}

function getUserWhere({
  userEmail,
  userId,
}: Pick<GetDashboardItemsOptions, "userEmail" | "userId">): DashboardItemWhere {
  if (userId) {
    return { userId };
  }

  return userEmail ? { user: { email: userEmail } } : {};
}

function getFindManyArgs(
  options: GetDashboardItemsOptions,
  where: DashboardItemWhere,
): DashboardItemFindManyArgs {
  return {
    orderBy: { lastViewedAt: "desc" },
    select: dashboardItemSelect,
    ...(options.limit ? { take: options.limit } : {}),
    where,
  };
}

export function toDashboardItem(item: DashboardItemRow): DashboardItem {
  return {
    description: item.description ?? "No description yet.",
    id: item.id,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    kind: dashboardItemKindByPrismaKind[item.kind],
    lastViewedAt: (item.lastViewedAt ?? item.updatedAt).toISOString(),
    tags: item.tags.map(({ tag }) => tag.name),
    title: item.title,
  };
}

export function toItemDetail(item: ItemDetailRow): ItemDetail {
  return {
    aiSummary: item.aiSummary,
    collections: item.collections.map(({ collection }) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
    })),
    content: item.content,
    contentKind: itemDetailContentKindByPrismaContentKind[item.contentKind],
    createdAt: item.createdAt.toISOString(),
    description: item.description,
    fileSizeBytes: item.fileSizeBytes,
    id: item.id,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    kind: dashboardItemKindByPrismaKind[item.kind],
    language: item.language,
    mimeType: item.mimeType,
    originalFileName: item.originalFileName,
    sourceUrl: item.sourceUrl,
    storageKey: item.storageKey,
    tags: item.tags.map(({ tag }) => tag.name),
    title: item.title,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getItemDetail(
  options: GetItemDetailOptions,
  client?: ItemDetailClient,
): Promise<ItemDetail | null> {
  const itemClient = client ?? (await getDefaultItemDetailClient());
  const item = await itemClient.item.findFirst({
    select: itemDetailSelect,
    where: {
      id: options.itemId,
      userId: options.userId,
    },
  });

  return item ? toItemDetail(item) : null;
}

export async function getDashboardPinnedItems(
  options: GetDashboardItemsOptions = {},
  client?: DashboardItemClient,
) {
  const itemClient = client ?? (await getDefaultItemClient());
  const items = await itemClient.item.findMany(
    getFindManyArgs(options, {
      isPinned: true,
      ...getUserWhere(options),
    }),
  );

  return items.map(toDashboardItem);
}

export async function getDashboardRecentItems(
  options: GetDashboardItemsOptions = {},
  client?: DashboardItemClient,
) {
  const itemClient = client ?? (await getDefaultItemClient());
  const items = await itemClient.item.findMany(
    getFindManyArgs(
      {
        ...options,
        limit: options.limit ?? DEFAULT_RECENT_ITEM_LIMIT,
      },
      {
        lastViewedAt: { not: null },
        ...getUserWhere(options),
      },
    ),
  );

  return items.map(toDashboardItem);
}

export async function getDashboardItemsByType(
  options: GetDashboardItemsByTypeOptions,
  client?: DashboardItemClient,
) {
  const itemClient = client ?? (await getDefaultItemClient());
  const items = await itemClient.item.findMany(
    getFindManyArgs(options, {
      kind: prismaItemKindByDashboardKind[options.kind],
      ...getUserWhere(options),
    }),
  );

  return items.map(toDashboardItem);
}

export async function getDashboardItemStats(
  options: Pick<GetDashboardItemsOptions, "userEmail" | "userId"> = {},
  client?: DashboardItemClient,
): Promise<DashboardItemStats> {
  const itemClient = client ?? (await getDefaultItemClient());
  const where = getUserWhere(options);
  const [total, favorite] = await Promise.all([
    itemClient.item.count({ where }),
    itemClient.item.count({
      where: {
        isFavorite: true,
        ...where,
      },
    }),
  ]);

  return {
    favorite,
    total,
  };
}

export async function getDashboardItemTypes(
  options: Pick<GetDashboardItemsOptions, "userEmail" | "userId"> = {},
  client?: DashboardItemClient,
): Promise<DashboardItemType[]> {
  const itemClient = client ?? (await getDefaultItemClient());
  if (!itemClient.itemType) {
    throw new Error("Dashboard item type client is required.");
  }
  if (!itemClient.item.groupBy) {
    throw new Error("Dashboard item groupBy client is required.");
  }

  const where = getUserWhere(options);
  const itemTypes = await itemClient.itemType.findMany({
    orderBy: { sortOrder: "asc" },
    select: dashboardItemTypeSelect,
    where: { isSystem: true },
  });
  const itemCounts = await itemClient.item.groupBy({
    _count: { _all: true },
    by: ["kind"],
    where,
  });
  const countByKind = new Map<PrismaItemKind, number>(
    itemCounts.map(({ _count, kind }) => [kind, _count._all]),
  );

  return itemTypes.map((itemType) => ({
    color: itemType.color,
    icon: itemType.icon,
    id: dashboardItemKindByPrismaKind[itemType.kind],
    isPro: itemType.isPro,
    label: itemType.label,
    slug: itemType.slug,
    pluralLabel: itemType.pluralLabel,
    count: countByKind.get(itemType.kind) ?? 0,
  }));
}
