import {
  Archive,
  ChartNoAxesColumn,
  Code2,
  File,
  Folder,
  Heart,
  Image,
  Link as LinkIcon,
  Pin,
  Sparkles,
  Star,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import NextLink from "next/link";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import {
  getDashboardCollectionStats,
  getDashboardCollections,
  type DashboardCollection,
} from "@/lib/db/collections";
import {
  getDashboardItemStats,
  getDashboardItemTypes,
  getDashboardPinnedItems,
  getDashboardRecentItems,
  type DashboardItem,
  type DashboardItemKind,
} from "@/lib/db/items";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const itemKindIcons: Record<DashboardItemKind, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  note: StickyNote,
  command: Terminal,
  file: File,
  image: Image,
  link: LinkIcon,
};

const itemKindStyles: Record<DashboardItemKind, string> = {
  snippet: "bg-blue-500/10 text-blue-400",
  prompt: "bg-violet-500/10 text-violet-400",
  note: "bg-yellow-500/10 text-yellow-300",
  command: "bg-orange-500/10 text-orange-400",
  file: "bg-slate-500/10 text-slate-400",
  image: "bg-pink-500/10 text-pink-400",
  link: "bg-emerald-500/10 text-emerald-400",
};

const itemKindAccentStyles: Record<DashboardItemKind, string> = {
  snippet: "border-l-blue-500",
  prompt: "border-l-violet-500",
  note: "border-l-yellow-300",
  command: "border-l-orange-500",
  file: "border-l-slate-500",
  image: "border-l-pink-500",
  link: "border-l-emerald-500",
};

interface DashboardStat {
  label: string;
  value: number;
  icon: LucideIcon;
  description: string;
}

function getDashboardStats(
  collectionStats: { favorite: number; total: number },
  itemStats: { favorite: number; total: number },
) {
  return [
    {
      label: "Items",
      value: itemStats.total,
      icon: Archive,
      description: "Saved resources",
    },
    {
      label: "Collections",
      value: collectionStats.total,
      icon: Folder,
      description: "Curated groups",
    },
    {
      label: "Favorite Items",
      value: itemStats.favorite,
      icon: Heart,
      description: "Marked for reuse",
    },
    {
      label: "Favorite Collections",
      value: collectionStats.favorite,
      icon: Star,
      description: "Pinned groups",
    },
  ];
}

function getDashboardUser(sessionUser?: Session["user"]): DashboardUser {
  const email = sessionUser?.email ?? currentUser.email;
  const name = sessionUser?.name ?? email.split("@")[0] ?? currentUser.name;

  return {
    email,
    id: sessionUser?.id ?? currentUser.id,
    image: sessionUser?.image ?? null,
    name,
    plan: currentUser.plan,
  };
}

export async function DashboardShell() {
  const session = await auth();
  const dashboardUser = getDashboardUser(session?.user);
  const [
    recentDashboardCollections,
    collectionStats,
    itemStats,
    sidebarItemTypes,
    pinnedDashboardItems,
    recentDashboardItems,
  ] = await Promise.all([
    getDashboardCollections({ limit: 6, userEmail: dashboardUser.email }),
    getDashboardCollectionStats({ userEmail: dashboardUser.email }),
    getDashboardItemStats({ userEmail: dashboardUser.email }),
    getDashboardItemTypes({ userEmail: dashboardUser.email }),
    getDashboardPinnedItems({ userEmail: dashboardUser.email }),
    getDashboardRecentItems({ limit: 10, userEmail: dashboardUser.email }),
  ]);
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = recentDashboardCollections
    .filter((collection) => collection.isFavorite)
    .slice(0, 4);
  const stats = getDashboardStats(collectionStats, itemStats);

  return (
    <DashboardFrame
      currentUser={dashboardUser}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      recentCollections={recentSidebarCollections}
    >
      <DashboardMain
        pinnedDashboardItems={pinnedDashboardItems}
        recentDashboardCollections={recentDashboardCollections}
        recentDashboardItems={recentDashboardItems}
        stats={stats}
      />
    </DashboardFrame>
  );
}

interface DashboardMainProps {
  pinnedDashboardItems: DashboardItem[];
  recentDashboardCollections: DashboardCollection[];
  recentDashboardItems: DashboardItem[];
  stats: DashboardStat[];
}

function DashboardMain({
  pinnedDashboardItems,
  recentDashboardCollections,
  recentDashboardItems,
  stats,
}: DashboardMainProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Your developer knowledge hub
          </p>
        </div>

        <section
          aria-label="Dashboard stats"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="rounded-lg border border-border bg-card p-5 text-card-foreground"
                key={stat.label}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <DashboardSection
          actionHref="/collections"
          actionLabel="View all"
          title="Recent Collections"
          titleIcon={Folder}
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {recentDashboardCollections.map((collection) => (
              <CollectionCard collection={collection} key={collection.id} />
            ))}
          </div>
        </DashboardSection>

        {pinnedDashboardItems.length > 0 ? (
          <DashboardSection title="Pinned Items" titleIcon={Pin}>
            <div className="grid gap-4 xl:grid-cols-2">
              {pinnedDashboardItems.map((item) => (
                <ItemCard item={item} key={item.id} />
              ))}
            </div>
          </DashboardSection>
        ) : null}

        <DashboardSection title="Recent Items" titleIcon={ChartNoAxesColumn}>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {recentDashboardItems.map((item) => (
              <RecentItemRow item={item} key={item.id} />
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}

interface DashboardSectionProps {
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  title: string;
  titleIcon: LucideIcon;
}

function DashboardSection({
  actionHref,
  actionLabel,
  children,
  title,
  titleIcon: TitleIcon,
}: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <TitleIcon className="size-5 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-2xl font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        {actionHref && actionLabel ? (
          <NextLink
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href={actionHref}
          >
            {actionLabel}
          </NextLink>
        ) : null}
      </div>
      {children}
    </section>
  );
}

interface CollectionCardProps {
  collection: DashboardCollection;
}

function CollectionCard({ collection }: CollectionCardProps) {
  const visibleTypes = collection.itemTypeIds;

  return (
    <NextLink
      className={cn(
        "group flex min-h-44 flex-col justify-between rounded-lg border border-l-4 border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50",
        collection.dominantItemKind
          ? itemKindAccentStyles[collection.dominantItemKind]
          : "border-l-border",
      )}
      href={`/collections/${collection.slug}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-semibold">
                {collection.name}
              </h3>
              {collection.isFavorite ? (
                <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {collection.itemCount} items
            </p>
          </div>
          <Folder className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {collection.description}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {visibleTypes.map((itemTypeId) => {
          const Icon = itemKindIcons[itemTypeId];

          return (
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-md",
                itemKindStyles[itemTypeId],
              )}
              key={itemTypeId}
            >
              <Icon className="size-4" />
            </span>
          );
        })}
      </div>
    </NextLink>
  );
}

interface ItemCardProps {
  item: DashboardItem;
}

function ItemCard({ item }: ItemCardProps) {
  const Icon = itemKindIcons[item.kind];

  return (
    <NextLink
      className={cn(
        "flex min-h-32 gap-4 rounded-lg border border-l-4 border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50",
        itemKindAccentStyles[item.kind],
      )}
      href={`/items/${item.kind}s/${item.id}`}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-lg",
          itemKindStyles[item.kind],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-lg font-semibold">{item.title}</h3>
          <Pin className="size-4 shrink-0 fill-muted-foreground text-muted-foreground" />
          {item.isFavorite ? (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
        <TagList tags={item.tags} />
      </div>
    </NextLink>
  );
}

interface RecentItemRowProps {
  item: DashboardItem;
}

function RecentItemRow({ item }: RecentItemRowProps) {
  const Icon = itemKindIcons[item.kind];

  return (
    <NextLink
      className={cn(
        "flex min-w-0 items-center gap-4 border-b border-l-4 border-border px-4 py-4 text-card-foreground transition-colors last:border-b-0 hover:bg-muted/40 sm:px-5",
        itemKindAccentStyles[item.kind],
      )}
      href={`/items/${item.kind}s/${item.id}`}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          itemKindStyles[item.kind],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-medium">{item.title}</h3>
          {item.isPinned ? (
            <Pin className="size-4 shrink-0 fill-muted-foreground text-muted-foreground" />
          ) : null}
          {item.isFavorite ? (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {item.description}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        <span className="rounded-md bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">
          {item.kind}
        </span>
        <span className="w-16 text-right text-sm text-muted-foreground">
          {formatShortDate(item.lastViewedAt)}
        </span>
      </div>
    </NextLink>
  );
}

interface TagListProps {
  tags: string[];
}

function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag) => (
        <span
          className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
