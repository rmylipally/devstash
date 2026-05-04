import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import { ItemTypePage } from "@/components/items/ItemTypePage";
import { getDashboardCollections } from "@/lib/db/collections";
import {
  getDashboardItemsByType,
  getDashboardItemTypes,
  type DashboardItemKind,
  type ItemCreateKind,
} from "@/lib/db/items";
import { currentUser } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface ItemsByTypePageProps {
  params: Promise<{
    type: string;
  }>;
}

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

function getCreatableItemKind(kind: DashboardItemKind): ItemCreateKind | null {
  if (kind === "file" || kind === "image") {
    return null;
  }

  return kind;
}

export default async function ItemsByTypePage({ params }: ItemsByTypePageProps) {
  const { type } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/items/${type}`);
  }

  const dashboardUser = getDashboardUser(session.user);
  const [recentDashboardCollections, sidebarItemTypes] = await Promise.all([
    getDashboardCollections({ limit: 6, userId: dashboardUser.id }),
    getDashboardItemTypes({ userId: dashboardUser.id }),
  ]);
  const itemType = sidebarItemTypes.find(
    (sidebarItemType) => sidebarItemType.slug === type,
  );

  if (!itemType) {
    notFound();
  }

  const items = await getDashboardItemsByType({
    kind: itemType.id,
    userId: dashboardUser.id,
  });
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = recentDashboardCollections
    .filter((collection) => collection.isFavorite)
    .slice(0, 4);
  const createInitialKind = getCreatableItemKind(itemType.id);
  const typeCreateAction = createInitialKind ? (
    <ItemCreateButton initialKind={createInitialKind} />
  ) : undefined;

  return (
    <DashboardFrame
      currentUser={dashboardUser}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      newItemAction={<ItemCreateButton />}
      recentCollections={recentSidebarCollections}
    >
      <ItemTypePage
        action={typeCreateAction}
        itemType={itemType}
        items={items}
      />
    </DashboardFrame>
  );
}
