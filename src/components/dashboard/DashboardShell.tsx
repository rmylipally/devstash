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
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { CollectionCreateButton } from "@/components/collections/CollectionCreateDialog";
import {
  CollectionDropdownMenu,
  CollectionFavoriteIconButton,
} from "@/components/collections/CollectionActions";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { DashboardItemOpenHandler } from "@/components/dashboard/DashboardItemOpenHandler";
import {
  ItemCard,
  ItemDrawerProvider,
  RecentItemRow,
} from "@/components/items/ItemDrawerProvider";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import {
  getDashboardCollectionOptions,
  getDashboardCollectionStats,
  getDashboardCollections,
  getFavoriteCollections,
  type DashboardCollection,
  type DashboardCollectionOption,
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
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/pagination";
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

function getDashboardUser(sessionUser: Session["user"]): DashboardUser {
  const email = sessionUser.email ?? currentUser.email;
  const name = sessionUser.name ?? email.split("@")[0] ?? currentUser.name;
  const plan = sessionUser.plan === "pro" ? "pro" : "free";

  return {
    email,
    id: sessionUser.id,
    image: sessionUser.image ?? null,
    name,
    plan,
  };
}

export async function DashboardShell() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const dashboardUser = getDashboardUser(session.user);
  const [
    recentDashboardCollections,
    sidebarFavoriteCollections,
    collectionStats,
    itemStats,
    sidebarItemTypes,
    pinnedDashboardItems,
    recentDashboardItems,
    collectionOptions,
  ] = await Promise.all([
    getDashboardCollections({ limit: DASHBOARD_COLLECTIONS_LIMIT, userId: dashboardUser.id }),
    getFavoriteCollections(dashboardUser.id),
    getDashboardCollectionStats({ userId: dashboardUser.id }),
    getDashboardItemStats({ userId: dashboardUser.id }),
    getDashboardItemTypes({ userId: dashboardUser.id }),
    getDashboardPinnedItems({ userId: dashboardUser.id }),
    getDashboardRecentItems({ limit: DASHBOARD_RECENT_ITEMS_LIMIT, userId: dashboardUser.id }),
    getDashboardCollectionOptions({ userId: dashboardUser.id }),
  ]);
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = sidebarFavoriteCollections.slice(0, 4);
  const stats = getDashboardStats(collectionStats, itemStats);

  return (
    <DashboardFrame
      currentUser={dashboardUser}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      newItemAction={
        <div className="flex shrink-0 items-center gap-2">
          <CollectionCreateButton />
          <ItemCreateButton availableCollections={collectionOptions} />
        </div>
      }
      recentCollections={recentSidebarCollections}
    >
      <DashboardMain
        pinnedDashboardItems={pinnedDashboardItems}
        collectionOptions={collectionOptions}
        recentDashboardCollections={recentDashboardCollections}
        recentDashboardItems={recentDashboardItems}
        stats={stats}
      />
    </DashboardFrame>
  );
}

interface DashboardMainProps {
  collectionOptions: DashboardCollectionOption[];
  pinnedDashboardItems: DashboardItem[];
  recentDashboardCollections: DashboardCollection[];
  recentDashboardItems: DashboardItem[];
  stats: DashboardStat[];
}

function DashboardMain({
  collectionOptions,
  pinnedDashboardItems,
  recentDashboardCollections,
  recentDashboardItems,
  stats,
}: DashboardMainProps) {
  return (
    <ItemDrawerProvider availableCollections={collectionOptions}>
      <DashboardItemOpenHandler />
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
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
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
                  <ItemCard
                    item={item}
                    key={item.id}
                    minHeightClassName="min-h-32"
                  />
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
    </ItemDrawerProvider>
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
    <div
      className={cn(
        "group relative flex min-h-44 flex-col justify-between rounded-lg border border-l-4 border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50",
        collection.dominantItemKind
          ? itemKindAccentStyles[collection.dominantItemKind]
          : "border-l-border",
      )}
    >
      <NextLink
        className="absolute inset-0 rounded-lg"
        href={`/collections/${collection.slug}`}
      >
        <span className="sr-only">View {collection.name}</span>
      </NextLink>
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
          <div className="relative z-10 flex items-center gap-1">
            <CollectionFavoriteIconButton
              collectionId={collection.id}
              initialIsFavorite={collection.isFavorite}
            />
            <CollectionDropdownMenu collection={collection} />
          </div>
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
    </div>
  );
}
