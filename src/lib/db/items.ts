import type {
  ContentKind as PrismaContentKind,
  ItemKind as PrismaItemKind,
} from "@/generated/prisma/enums";
import { DASHBOARD_RECENT_ITEMS_LIMIT } from "@/lib/pagination";

export type DashboardItemKind =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "file"
  | "image"
  | "link";

export type ItemCreateKind = DashboardItemKind;

export interface DashboardItem {
  id: string;
  title: string;
  kind: DashboardItemKind;
  description: string;
  fileSizeBytes: number | null;
  originalFileName: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastViewedAt: string;
  uploadedAt: string;
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

export interface ItemUpdateInput {
  collectionIds?: string[];
  content?: string | null;
  description?: string | null;
  language?: string | null;
  tags: string[];
  title: string;
  url?: string | null;
}

export interface ItemCreateInput {
  collectionIds?: string[];
  content?: string | null;
  description?: string | null;
  fileSizeBytes?: number | null;
  kind: ItemCreateKind;
  language?: string | null;
  mimeType?: string | null;
  originalFileName?: string | null;
  storageKey?: string | null;
  tags: string[];
  title: string;
  url?: string | null;
}

export interface DashboardItemRow {
  createdAt: Date;
  id: string;
  title: string;
  kind: PrismaItemKind;
  description: string | null;
  fileSizeBytes: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastViewedAt: Date | null;
  originalFileName: string | null;
  updatedAt: Date;
  tags: Array<{
    tag: {
      name: string;
    };
  }>;
}

export interface DashboardItemWhere {
  collections?: {
    some: {
      collection: {
        slug: string;
        userId: string;
      };
    };
  };
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
    createdAt: true;
    description: true;
    fileSizeBytes: true;
    id: true;
    isFavorite: true;
    isPinned: true;
    kind: true;
    lastViewedAt: true;
    originalFileName: true;
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
  skip?: number;
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

export interface ItemTagCreateInput {
  tag: {
    connectOrCreate: {
      create: {
        name: string;
        slug: string;
        userId: string;
      };
      where: {
        userId_slug: {
          slug: string;
          userId: string;
        };
      };
    };
  };
}

export interface ItemCollectionCreateInput {
  collection: {
    connect: {
      id: string;
    };
  };
}

export interface ItemDetailUpdateArgs {
  data: {
    collections?: {
      create: ItemCollectionCreateInput[];
    };
    content?: string | null;
    description?: string | null;
    language?: string | null;
    sourceUrl?: string | null;
    tags: {
      create: ItemTagCreateInput[];
    };
    title: string;
  };
  select: ItemDetailFindFirstArgs["select"];
  where: {
    id: string;
    userId: string;
  };
}

export interface ItemTagDeleteManyArgs {
  where: {
    item: {
      userId: string;
    };
    itemId: string;
  };
}

export interface ItemCollectionDeleteManyArgs {
  where: {
    collection: {
      userId: string;
    };
    itemId: string;
  };
}

export interface ItemDetailCreateArgs {
  data: {
    collections?: {
      create: ItemCollectionCreateInput[];
    };
    content: string | null;
    contentKind: PrismaContentKind;
    description: string | null;
    fileSizeBytes?: number | null;
    kind: PrismaItemKind;
    language: string | null;
    mimeType?: string | null;
    originalFileName?: string | null;
    sourceUrl: string | null;
    storageKey?: string | null;
    tags: {
      create: ItemTagCreateInput[];
    };
    title: string;
    userId: string;
  };
  select: ItemDetailFindFirstArgs["select"];
}

export interface ItemDeleteManyArgs {
  where: {
    id: string;
    userId: string;
  };
}

export interface ItemDeleteManyResult {
  count: number;
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

export interface ItemUpdateTransactionClient {
  collection: {
    findMany(args: ItemCollectionFindManyArgs): Promise<ItemCollectionRow[]>;
  };
  collectionItem: {
    deleteMany(
      args: ItemCollectionDeleteManyArgs,
    ): Promise<ItemDeleteManyResult>;
  };
  item: {
    update(args: ItemDetailUpdateArgs): Promise<ItemDetailRow>;
  };
  itemTag: {
    deleteMany(args: ItemTagDeleteManyArgs): Promise<ItemDeleteManyResult>;
  };
}

export interface ItemUpdateClient extends ItemUpdateTransactionClient {
  $transaction?<T>(
    fn: (client: ItemUpdateTransactionClient) => Promise<T>,
  ): Promise<T>;
}

export interface ItemCreateClient {
  collection: {
    findMany(args: ItemCollectionFindManyArgs): Promise<ItemCollectionRow[]>;
  };
  item: {
    create(args: ItemDetailCreateArgs): Promise<ItemDetailRow>;
  };
}

export interface ItemCollectionFindManyArgs {
  select: {
    id: true;
  };
  where: {
    id: {
      in: string[];
    };
    userId: string;
  };
}

export interface ItemCollectionRow {
  id: string;
}

export interface ItemDeleteClient {
  item: {
    deleteMany(args: ItemDeleteManyArgs): Promise<ItemDeleteManyResult>;
  };
}

interface GetDashboardItemsOptions {
  limit?: number;
  offset?: number;
  userEmail?: string;
  userId?: string;
}

interface GetDashboardItemsByTypeOptions extends GetDashboardItemsOptions {
  kind: DashboardItemKind;
}

interface GetDashboardItemsByCollectionSlugOptions
  extends GetDashboardItemsOptions {
  collectionSlug: string;
  userId: string;
}

interface GetItemDetailOptions {
  itemId: string;
  userId: string;
}

interface UpdateItemOptions extends GetItemDetailOptions {
  data: ItemUpdateInput;
}

interface CreateItemOptions {
  data: ItemCreateInput;
  userId: string;
}

type DeleteItemOptions = GetItemDetailOptions;

type ToggleItemFavoriteOptions = GetItemDetailOptions;

const DEFAULT_RECENT_ITEM_LIMIT = DASHBOARD_RECENT_ITEMS_LIMIT;

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
  createdAt: true,
  description: true,
  fileSizeBytes: true,
  id: true,
  isFavorite: true,
  isPinned: true,
  kind: true,
  lastViewedAt: true,
  originalFileName: true,
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

async function getDefaultItemUpdateClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as ItemUpdateClient;
}

async function getDefaultItemCreateClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as ItemCreateClient;
}

async function getDefaultItemDeleteClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as ItemDeleteClient;
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
    ...(options.offset ? { skip: options.offset } : {}),
    ...(options.limit ? { take: options.limit } : {}),
    where,
  };
}

function getItemsByTypeWhere(options: GetDashboardItemsByTypeOptions): DashboardItemWhere {
  return {
    kind: prismaItemKindByDashboardKind[options.kind],
    ...getUserWhere(options),
  };
}

function getItemsByCollectionSlugWhere(
  options: GetDashboardItemsByCollectionSlugOptions,
): DashboardItemWhere {
  return {
    collections: {
      some: {
        collection: {
          slug: options.collectionSlug,
          userId: options.userId,
        },
      },
    },
    userId: options.userId,
  };
}

function slugifyTagName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tag"
  );
}

function getUniqueTags(tags: string[]) {
  const seen = new Set<string>();
  const uniqueTags: string[] = [];

  for (const tag of tags) {
    const name = tag.trim();
    const key = name.toLowerCase();

    if (!name || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueTags.push(name);
  }

  return uniqueTags;
}

function getUniqueCollectionIds(collectionIds: string[] | undefined) {
  const seen = new Set<string>();
  const uniqueCollectionIds: string[] = [];

  for (const collectionId of collectionIds ?? []) {
    const id = collectionId.trim();

    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    uniqueCollectionIds.push(id);
  }

  return uniqueCollectionIds;
}

function toTagCreateInput(userId: string, name: string): ItemTagCreateInput {
  const slug = slugifyTagName(name);

  return {
    tag: {
      connectOrCreate: {
        create: {
          name,
          slug,
          userId,
        },
        where: {
          userId_slug: {
            slug,
            userId,
          },
        },
      },
    },
  };
}

function toCollectionCreateInput(id: string): ItemCollectionCreateInput {
  return {
    collection: {
      connect: {
        id,
      },
    },
  };
}

async function getUserOwnedCollectionIds(
  collectionIds: string[] | undefined,
  userId: string,
  collectionClient: Pick<ItemCreateClient, "collection">,
) {
  const uniqueCollectionIds = getUniqueCollectionIds(collectionIds);

  if (uniqueCollectionIds.length === 0) {
    return [];
  }

  const collections = await collectionClient.collection.findMany({
    select: { id: true },
    where: {
      id: {
        in: uniqueCollectionIds,
      },
      userId,
    },
  });
  const ownedCollectionIds = new Set(collections.map((collection) => collection.id));

  if (ownedCollectionIds.size !== uniqueCollectionIds.length) {
    throw new Error("One or more selected collections are unavailable.");
  }

  return uniqueCollectionIds.filter((collectionId) =>
    ownedCollectionIds.has(collectionId),
  );
}

async function getItemUpdateData(
  data: ItemUpdateInput,
  userId: string,
  collectionClient: Pick<ItemUpdateTransactionClient, "collection">,
): Promise<ItemDetailUpdateArgs["data"]> {
  const updateData: ItemDetailUpdateArgs["data"] = {
    tags: {
      create: getUniqueTags(data.tags).map((tag) =>
        toTagCreateInput(userId, tag),
      ),
    },
    title: data.title,
  };

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.content !== undefined) {
    updateData.content = data.content;
  }

  if (data.language !== undefined) {
    updateData.language = data.language;
  }

  if (data.url !== undefined) {
    updateData.sourceUrl = data.url;
  }

  if (data.collectionIds !== undefined) {
    const collectionIds = await getUserOwnedCollectionIds(
      data.collectionIds,
      userId,
      collectionClient,
    );

    updateData.collections = {
      create: collectionIds.map(toCollectionCreateInput),
    };
  }

  return updateData;
}

async function getItemCreateData(
  data: ItemCreateInput,
  userId: string,
  collectionClient: Pick<ItemCreateClient, "collection">,
): Promise<ItemDetailCreateArgs["data"]> {
  const isLink = data.kind === "link";
  const isUpload = data.kind === "file" || data.kind === "image";
  const supportsLanguage = data.kind === "command" || data.kind === "snippet";
  const createData: ItemDetailCreateArgs["data"] = {
    content: isLink || isUpload ? null : (data.content ?? null),
    contentKind: isLink ? "URL" : isUpload ? "FILE" : "TEXT",
    description: data.description ?? null,
    kind: prismaItemKindByDashboardKind[data.kind],
    language: supportsLanguage ? (data.language ?? null) : null,
    sourceUrl: isLink ? (data.url ?? null) : null,
    tags: {
      create: getUniqueTags(data.tags).map((tag) =>
        toTagCreateInput(userId, tag),
      ),
    },
    title: data.title,
    userId,
  };

  if (isUpload) {
    createData.fileSizeBytes = data.fileSizeBytes ?? null;
    createData.mimeType = data.mimeType ?? null;
    createData.originalFileName = data.originalFileName ?? null;
    createData.storageKey = data.storageKey ?? null;
  }

  if (data.collectionIds !== undefined) {
    const collectionIds = await getUserOwnedCollectionIds(
      data.collectionIds,
      userId,
      collectionClient,
    );

    createData.collections = {
      create: collectionIds.map(toCollectionCreateInput),
    };
  }

  return createData;
}

export function toDashboardItem(item: DashboardItemRow): DashboardItem {
  return {
    description: item.description ?? "No description yet.",
    fileSizeBytes: item.fileSizeBytes,
    id: item.id,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    kind: dashboardItemKindByPrismaKind[item.kind],
    lastViewedAt: (item.lastViewedAt ?? item.updatedAt).toISOString(),
    originalFileName: item.originalFileName,
    tags: item.tags.map(({ tag }) => tag.name),
    title: item.title,
    uploadedAt: item.createdAt.toISOString(),
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

export async function updateItem(
  options: UpdateItemOptions,
  client?: ItemUpdateClient,
): Promise<ItemDetail> {
  const itemClient = client ?? (await getDefaultItemUpdateClient());
  const updateItemWithTags = async (tx: ItemUpdateTransactionClient) => {
    const updateData = await getItemUpdateData(
      options.data,
      options.userId,
      tx,
    );

    await tx.itemTag.deleteMany({
      where: {
        item: {
          userId: options.userId,
        },
        itemId: options.itemId,
      },
    });

    if (options.data.collectionIds !== undefined) {
      await tx.collectionItem.deleteMany({
        where: {
          collection: {
            userId: options.userId,
          },
          itemId: options.itemId,
        },
      });
    }

    return tx.item.update({
      data: updateData,
      select: itemDetailSelect,
      where: {
        id: options.itemId,
        userId: options.userId,
      },
    });
  };
  const item = itemClient.$transaction
    ? await itemClient.$transaction(updateItemWithTags)
    : await updateItemWithTags(itemClient);

  return toItemDetail(item);
}

export async function createItem(
  options: CreateItemOptions,
  client?: ItemCreateClient,
): Promise<ItemDetail> {
  const itemClient = client ?? (await getDefaultItemCreateClient());
  const data = await getItemCreateData(
    options.data,
    options.userId,
    itemClient,
  );
  const item = await itemClient.item.create({
    data,
    select: itemDetailSelect,
  });

  return toItemDetail(item);
}

export async function deleteItem(
  options: DeleteItemOptions,
  client?: ItemDeleteClient,
): Promise<boolean> {
  const itemClient = client ?? (await getDefaultItemDeleteClient());
  const result = await itemClient.item.deleteMany({
    where: {
      id: options.itemId,
      userId: options.userId,
    },
  });

  return result.count > 0;
}

export async function toggleItemFavorite(
  options: ToggleItemFavoriteOptions,
): Promise<ItemDetail | null> {
  const { prisma } = await import("@/lib/prisma");

  const existing = await prisma.item.findFirst({
    select: {
      id: true,
      isFavorite: true,
    },
    where: {
      id: options.itemId,
      userId: options.userId,
    },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.item.update({
    data: {
      isFavorite: !existing.isFavorite,
    },
    select: itemDetailSelect,
    where: {
      id: options.itemId,
      userId: options.userId,
    },
  });

  return toItemDetail(updated as unknown as ItemDetailRow);
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
    getFindManyArgs(options, getItemsByTypeWhere(options)),
  );

  return items.map(toDashboardItem);
}

export async function getDashboardItemCountByType(
  options: GetDashboardItemsByTypeOptions,
  client?: DashboardItemClient,
): Promise<number> {
  const itemClient = client ?? (await getDefaultItemClient());

  return itemClient.item.count({
    where: getItemsByTypeWhere(options),
  });
}

export async function getDashboardItemsByCollectionSlug(
  options: GetDashboardItemsByCollectionSlugOptions,
  client?: DashboardItemClient,
) {
  const itemClient = client ?? (await getDefaultItemClient());
  const items = await itemClient.item.findMany(
    getFindManyArgs(options, getItemsByCollectionSlugWhere(options)),
  );

  return items.map(toDashboardItem);
}

export async function getDashboardItemCountByCollectionSlug(
  options: GetDashboardItemsByCollectionSlugOptions,
  client?: DashboardItemClient,
): Promise<number> {
  const itemClient = client ?? (await getDefaultItemClient());

  return itemClient.item.count({
    where: getItemsByCollectionSlugWhere(options),
  });
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

export async function getFavoriteItems(
  options: Pick<GetDashboardItemsOptions, "userEmail" | "userId"> = {},
  client?: DashboardItemClient,
): Promise<DashboardItem[]> {
  const itemClient = client ?? (await getDefaultItemClient());
  const where = getUserWhere(options);
  const items = await itemClient.item.findMany({
    ...getFindManyArgs(options, where),
    where: { ...where, isFavorite: true },
  });

  return items.map(toDashboardItem);
}

export async function getFavoritesCount(
  options: Pick<GetDashboardItemsOptions, "userEmail" | "userId"> = {},
  client?: DashboardItemClient,
): Promise<number> {
  const itemClient = client ?? (await getDefaultItemClient());
  const where = getUserWhere(options);
  return itemClient.item.count({
    where: { ...where, isFavorite: true },
  });
}
