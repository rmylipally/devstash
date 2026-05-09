import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import { ItemTypePage } from "@/components/items/ItemTypePage";
import { ProUpgradeCard } from "@/components/items/ProUpgradeCard";
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
        <ProUpgradeCard currentPlan={dashboardUser.plan} itemTypeLabel={itemType.pluralLabel} />
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
      newItemAction={typeCreateAction}
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
