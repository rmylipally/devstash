import { Folder, Star } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { CollectionCreateButton } from "@/components/collections/CollectionCreateDialog";
import { CollectionDetailActions } from "@/components/collections/CollectionActions";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import {
  ItemCard,
  ItemDrawerProvider,
} from "@/components/items/ItemDrawerProvider";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import {
  getDashboardCollectionOptions,
  getDashboardCollectionBySlug,
  getDashboardCollections,
  getFavoriteCollections,
  type DashboardCollectionOption,
} from "@/lib/db/collections";
import {
  getDashboardItemCountByCollectionSlug,
  getDashboardItemsByCollectionSlug,
  getDashboardItemTypes,
  type DashboardItem,
} from "@/lib/db/items";
import { currentUser } from "@/lib/mock-data";
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  getPageOffset,
  getTotalPages,
  parsePageParam,
} from "@/lib/pagination";
import { PaginationNav } from "@/components/ui/pagination-nav";

export const dynamic = "force-dynamic";

interface CollectionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
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

export default async function CollectionDetailPage({
  params,
  searchParams,
}: CollectionDetailPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/collections/${slug}`);
  }

  const dashboardUser = getDashboardUser(session.user);
  const requestedPage = parsePageParam(page);
  const [
    recentDashboardCollections,
    sidebarFavoriteCollections,
    sidebarItemTypes,
    collectionOptions,
    collection,
    collectionItemCount,
  ] = await Promise.all([
    getDashboardCollections({ limit: DASHBOARD_COLLECTIONS_LIMIT, userId: dashboardUser.id }),
    getFavoriteCollections(dashboardUser.id),
    getDashboardItemTypes({ userId: dashboardUser.id }),
    getDashboardCollectionOptions({ userId: dashboardUser.id }),
    getDashboardCollectionBySlug({ slug, userId: dashboardUser.id }),
    getDashboardItemCountByCollectionSlug({ collectionSlug: slug, userId: dashboardUser.id }),
  ]);

  if (!collection) {
    notFound();
  }

  const totalPages = getTotalPages(collectionItemCount, COLLECTIONS_PER_PAGE);
  const currentPage = Math.min(requestedPage, totalPages);
  const collectionItems = await getDashboardItemsByCollectionSlug({
    collectionSlug: slug,
    limit: COLLECTIONS_PER_PAGE,
    offset: getPageOffset(currentPage, COLLECTIONS_PER_PAGE),
    userId: dashboardUser.id,
  });

  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = sidebarFavoriteCollections.slice(0, 4);

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
      <CollectionDetailMain
        collection={collection}
        collectionItems={collectionItems}
        collectionOptions={collectionOptions}
        currentPage={currentPage}
        totalItemCount={collectionItemCount}
        totalPages={totalPages}
      />
    </DashboardFrame>
  );
}

function CollectionDetailMain({
  collection,
  collectionItems,
  collectionOptions,
  currentPage,
  totalItemCount,
  totalPages,
}: {
  collection: {
    description: string;
    id: string;
    isFavorite: boolean;
    name: string;
    slug: string;
  };
  collectionItems: DashboardItem[];
  collectionOptions: DashboardCollectionOption[];
  currentPage: number;
  totalItemCount: number;
  totalPages: number;
}) {
  return (
    <ItemDrawerProvider availableCollections={collectionOptions}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Folder className="size-7" />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-4xl font-semibold tracking-tight">
                    {collection.name}
                  </h1>
                  {collection.isFavorite ? (
                    <Star className="size-5 shrink-0 fill-yellow-400 text-yellow-400" />
                  ) : null}
                </div>
                <p className="text-lg text-muted-foreground">
                  {collection.description}
                </p>
              </div>
              <CollectionDetailActions collection={collection} />
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">Items</h2>
              <p className="text-sm text-muted-foreground">
                {totalItemCount} saved items
              </p>
            </div>
            {collectionItems.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {collectionItems.map((item) => (
                    <ItemCard item={item} key={item.id} />
                  ))}
                </div>
                <PaginationNav
                  basePath={`/collections/${collection.slug}`}
                  className="pt-2"
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-card-foreground">
                <p className="text-lg font-medium">
                  No items in this collection yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </ItemDrawerProvider>
  );
}
