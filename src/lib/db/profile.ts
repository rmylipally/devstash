import type { ItemKind as PrismaItemKind } from "@/generated/prisma/enums";

export type ProfileItemKind =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "file"
  | "image"
  | "link";

interface ProfileUser {
  createdAt: Date;
  email: string;
  id: string;
  image: string | null;
  name: string | null;
  passwordHash: string | null;
}

interface ProfileUserWhere {
  email?: string;
  id?: string;
}

interface ProfileItemTypeRow {
  color: string;
  icon: string;
  id: string;
  kind: PrismaItemKind;
  label: string;
  pluralLabel: string;
  slug: string;
}

interface ProfileItemGroupByRow {
  _count: {
    _all: number;
  };
  kind: PrismaItemKind;
}

export interface ProfileDataClient {
  collection: {
    count(args: { where: { userId: string } }): Promise<number>;
  };
  item: {
    count(args: { where: { userId: string } }): Promise<number>;
    groupBy(args: {
      _count: { _all: true };
      by: ["kind"];
      where: { userId: string };
    }): Promise<ProfileItemGroupByRow[]>;
  };
  itemType: {
    findMany(args: {
      orderBy: { sortOrder: "asc" };
      select: {
        color: true;
        icon: true;
        id: true;
        kind: true;
        label: true;
        pluralLabel: true;
        slug: true;
      };
      where: { isSystem: true };
    }): Promise<ProfileItemTypeRow[]>;
  };
  user: {
    findUnique(args: {
      select: {
        createdAt: true;
        email: true;
        id: true;
        image: true;
        name: true;
        passwordHash: true;
      };
      where: ProfileUserWhere;
    }): Promise<ProfileUser | null>;
  };
}

export interface ProfileData {
  accountCreatedAt: string;
  canChangePassword: boolean;
  email: string;
  id: string;
  image: string | null;
  itemTypes: ProfileItemType[];
  name: string;
  stats: {
    totalCollections: number;
    totalItems: number;
  };
}

export interface ProfileItemType {
  color: string;
  count: number;
  icon: string;
  id: ProfileItemKind;
  label: string;
  pluralLabel: string;
  slug: string;
}

interface GetProfileDataOptions {
  userEmail?: string;
  userId?: string;
}

const profileItemKindByPrismaKind: Record<PrismaItemKind, ProfileItemKind> = {
  COMMAND: "command",
  FILE: "file",
  IMAGE: "image",
  LINK: "link",
  NOTE: "note",
  PROMPT: "prompt",
  SNIPPET: "snippet",
};

const profileUserSelect = {
  createdAt: true,
  email: true,
  id: true,
  image: true,
  name: true,
  passwordHash: true,
} as const;

const profileItemTypeSelect = {
  color: true,
  icon: true,
  id: true,
  kind: true,
  label: true,
  pluralLabel: true,
  slug: true,
} as const;

async function getDefaultProfileDataClient() {
  const { prisma } = await import("@/lib/prisma");

  return prisma as unknown as ProfileDataClient;
}

function getUserWhere({ userEmail, userId }: GetProfileDataOptions) {
  if (userId) {
    return { id: userId };
  }

  return userEmail ? { email: userEmail } : undefined;
}

function getDisplayName(user: Pick<ProfileUser, "email" | "name">) {
  return user.name?.trim() || user.email.split("@")[0] || "DevStash User";
}

export async function getProfileData(
  options: GetProfileDataOptions,
  client?: ProfileDataClient,
): Promise<ProfileData | null> {
  const where = getUserWhere(options);

  if (!where) {
    return null;
  }

  const profileClient = client ?? (await getDefaultProfileDataClient());
  const user = await profileClient.user.findUnique({
    select: profileUserSelect,
    where,
  });

  if (!user) {
    return null;
  }

  const [totalItems, totalCollections, itemTypes, itemCounts] =
    await Promise.all([
      profileClient.item.count({ where: { userId: user.id } }),
      profileClient.collection.count({ where: { userId: user.id } }),
      profileClient.itemType.findMany({
        orderBy: { sortOrder: "asc" },
        select: profileItemTypeSelect,
        where: { isSystem: true },
      }),
      profileClient.item.groupBy({
        _count: { _all: true },
        by: ["kind"],
        where: { userId: user.id },
      }),
    ]);
  const countByKind = new Map<PrismaItemKind, number>(
    itemCounts.map(({ _count, kind }) => [kind, _count._all]),
  );

  return {
    accountCreatedAt: user.createdAt.toISOString(),
    canChangePassword: Boolean(user.passwordHash),
    email: user.email,
    id: user.id,
    image: user.image,
    itemTypes: itemTypes.map((itemType) => ({
      color: itemType.color,
      count: countByKind.get(itemType.kind) ?? 0,
      icon: itemType.icon,
      id: profileItemKindByPrismaKind[itemType.kind],
      label: itemType.label,
      pluralLabel: itemType.pluralLabel,
      slug: itemType.slug,
    })),
    name: getDisplayName(user),
    stats: {
      totalCollections,
      totalItems,
    },
  };
}
