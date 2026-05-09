import { notFound, redirect } from "next/navigation";
import NextLink from "next/link";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import { ItemTypePage } from "@/components/items/ItemTypePage";
import {
  getDashboardCollectionOptions,
  getDashboardCollections,
  getFavoriteCollections,
} from "@/lib/db/collections";
import {
  getDashboardItemsByType,
  getDashboardItemCountByType,
  getDashboardItemTypes,
  type DashboardItemKind,
  type ItemCreateKind,
} from "@/lib/db/items";
import { currentUser } from "@/lib/mock-data";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  ITEMS_PER_PAGE,
  getPageOffset,
  getTotalPages,
  parsePageParam,
} from "@/lib/pagination";
import { getItemKindPlanAccessResult } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

interface ItemsByTypePageProps {
  params: Promise<{
    type: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
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

function getCreatableItemKind(kind: DashboardItemKind): ItemCreateKind | null {
  return kind;
}

function ProUpgradeRequiredPage({
  itemTypeLabel,
}: {
  itemTypeLabel: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="rounded-lg border border-border bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium text-primary">Pro feature</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {itemTypeLabel} require Pro
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Upgrade your plan to browse and manage {itemTypeLabel.toLowerCase()} items.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <NextLink
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              href="/settings"
            >
              Upgrade to Pro
            </NextLink>
            <NextLink
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/dashboard"
            >
              Back to dashboard
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: ItemsByTypePageProps) {
  const { type } = await params;
  const { page } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/items/${type}`);
  }

  const dashboardUser = getDashboardUser(session.user);
  const [
    recentDashboardCollections,
    sidebarFavoriteCollections,
    sidebarItemTypes,
    collectionOptions,
  ] = await Promise.all([
    getDashboardCollections({ limit: DASHBOARD_COLLECTIONS_LIMIT, userId: dashboardUser.id }),
    getFavoriteCollections(dashboardUser.id),
    getDashboardItemTypes({ userId: dashboardUser.id }),
    getDashboardCollectionOptions({ userId: dashboardUser.id }),
  ]);
  const itemType = sidebarItemTypes.find(
    (sidebarItemType) => sidebarItemType.slug === type,
  );

  if (!itemType) {
    notFound();
  }

  const itemTypePlanAccess = getItemKindPlanAccessResult({
    kind: itemType.id,
    plan: dashboardUser.plan,
  });

  if (!itemTypePlanAccess.allowed) {
    const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
    const favoriteCollections = sidebarFavoriteCollections.slice(0, 4);

    return (
      <DashboardFrame
        currentUser={dashboardUser}
        favoriteCollections={favoriteCollections}
        itemTypes={sidebarItemTypes}
        newItemAction={
          <ItemCreateButton availableCollections={collectionOptions} />
        }
        recentCollections={recentSidebarCollections}
      >
        <ProUpgradeRequiredPage itemTypeLabel={itemType.pluralLabel} />
      </DashboardFrame>
    );
  }

  const requestedPage = parsePageParam(page);
  const totalItems = await getDashboardItemCountByType({
    kind: itemType.id,
    userId: dashboardUser.id,
  });
  const totalPages = getTotalPages(totalItems, ITEMS_PER_PAGE);
  const currentPage = Math.min(requestedPage, totalPages);
  const items = await getDashboardItemsByType({
    kind: itemType.id,
    limit: ITEMS_PER_PAGE,
    offset: getPageOffset(currentPage, ITEMS_PER_PAGE),
    userId: dashboardUser.id,
  });
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = sidebarFavoriteCollections.slice(0, 4);
  const createInitialKind = getCreatableItemKind(itemType.id);
  const typeCreateAction = createInitialKind ? (
    <ItemCreateButton
      availableCollections={collectionOptions}
      initialKind={createInitialKind}
    />
  ) : undefined;

  return (
    <DashboardFrame
      currentUser={dashboardUser}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      newItemAction={
        <ItemCreateButton availableCollections={collectionOptions} />
      }
      recentCollections={recentSidebarCollections}
    >
      <ItemTypePage
        action={typeCreateAction}
        availableCollections={collectionOptions}
        basePath={`/items/${itemType.slug}`}
        currentPage={currentPage}
        itemType={itemType}
        items={items}
        totalItems={totalItems}
        totalPages={totalPages}
      />
    </DashboardFrame>
  );
}
