import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import {
  ItemDrawerProvider,
} from "@/components/items/ItemDrawerProvider";
import {
  getDashboardCollectionOptions,
  getDashboardCollections,
  getFavoriteCollections,
} from "@/lib/db/collections";
import {
  getDashboardItemTypes,
  getFavoriteItems,
} from "@/lib/db/items";
import { currentUser } from "@/lib/mock-data";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/pagination";

export const dynamic = "force-dynamic";

function getDashboardUser(sessionUser: Session["user"]): DashboardUser {
  const email = sessionUser.email ?? currentUser.email;
  const name = sessionUser.name ?? email.split("@")[0] ?? currentUser.name;

  return {
    email,
    id: sessionUser.id,
    image: sessionUser.image ?? null,
    name,
    plan: currentUser.plan,
  };
}

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/favorites");
  }

  const dashboardUser = getDashboardUser(session.user);
  const [favoriteItems, favoriteCollections, sidebarItemTypes, recentDashboardCollections, collectionOptions] = await Promise.all([
    getFavoriteItems({ userId: dashboardUser.id }),
    getFavoriteCollections(dashboardUser.id),
    getDashboardItemTypes({ userId: dashboardUser.id }),
    getDashboardCollections({ limit: DASHBOARD_COLLECTIONS_LIMIT, userId: dashboardUser.id }),
    getDashboardCollectionOptions({ userId: dashboardUser.id }),
  ]);

  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollectionsForSidebar = favoriteCollections.slice(0, 4);

  return (
    <DashboardFrame
      currentUser={dashboardUser}
      favoriteCollections={favoriteCollectionsForSidebar}
      itemTypes={sidebarItemTypes}
      newItemAction={
        <ItemCreateButton availableCollections={collectionOptions} />
      }
      recentCollections={recentSidebarCollections}
    >
      <ItemDrawerProvider availableCollections={collectionOptions}>
        <FavoritesList
          items={favoriteItems}
          collections={favoriteCollections}
        />
      </ItemDrawerProvider>
    </DashboardFrame>
  );
}
