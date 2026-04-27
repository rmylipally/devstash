import type { ItemKind as PrismaItemKind } from "@/generated/prisma/enums";

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

export interface DashboardItemClient {
  item: {
    count(args: DashboardItemCountArgs): Promise<number>;
    findMany(args: DashboardItemFindManyArgs): Promise<DashboardItemRow[]>;
  };
  itemType?: {
    findMany(
      args: DashboardItemTypeFindManyArgs,
    ): Promise<DashboardItemTypeRow[]>;
  };
}

interface GetDashboardItemsOptions {
  limit?: number;
  userEmail?: string;
  userId?: string;
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

async function getDefaultItemClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as DashboardItemClient;
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

  const where = getUserWhere(options);
  const itemTypes = await itemClient.itemType.findMany({
    orderBy: { sortOrder: "asc" },
    select: dashboardItemTypeSelect,
    where: { isSystem: true },
  });
  const counts = await Promise.all(
    itemTypes.map(({ kind }) =>
      itemClient.item.count({
        where: {
          kind,
          ...where,
        },
      }),
    ),
  );

  return itemTypes.map((itemType, index) => ({
    color: itemType.color,
    icon: itemType.icon,
    id: dashboardItemKindByPrismaKind[itemType.kind],
    isPro: itemType.isPro,
    label: itemType.label,
    slug: itemType.slug,
    pluralLabel: itemType.pluralLabel,
    count: counts[index] ?? 0,
  }));
}
