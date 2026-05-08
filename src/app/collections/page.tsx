import { Star } from "lucide-react";
import NextLink from "next/link";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { CollectionCreateButton } from "@/components/collections/CollectionCreateDialog";
import { CollectionDropdownMenu } from "@/components/collections/CollectionActions";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import {
  getDashboardCollectionOptions,
  getDashboardCollections,
  type DashboardCollection,
} from "@/lib/db/collections";
import { getDashboardItemTypes } from "@/lib/db/items";
import { currentUser } from "@/lib/mock-data";

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

export default async function CollectionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/collections");
  }

  const dashboardUser = getDashboardUser(session.user);
  const [collections, sidebarItemTypes, collectionOptions] = await Promise.all([
    getDashboardCollections({ limit: 100, userId: dashboardUser.id }),
    getDashboardItemTypes({ userId: dashboardUser.id }),
    getDashboardCollectionOptions({ userId: dashboardUser.id }),
  ]);
  const recentSidebarCollections = collections.slice(0, 4);
  const favoriteCollections = collections
    .filter((collection) => collection.isFavorite)
    .slice(0, 4);

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
      <CollectionsMain collections={collections} />
    </DashboardFrame>
  );
}

function CollectionsMain({
  collections,
}: {
  collections: DashboardCollection[];
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">
            Collections
          </h1>
          <p className="text-lg text-muted-foreground">
            Curated groups for saved items.
          </p>
        </div>

        {collections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <CollectionOverviewCard
                collection={collection}
                key={collection.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-card-foreground">
            <p className="text-lg font-medium">No collections yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionOverviewCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  return (
    <div className="group relative flex min-h-40 flex-col justify-between rounded-lg border border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50">
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
              <h2 className="truncate text-lg font-semibold">
                {collection.name}
              </h2>
              {collection.isFavorite ? (
                <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {collection.itemCount} items
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-1">
            <CollectionDropdownMenu collection={collection} />
          </div>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {collection.description}
        </p>
      </div>
    </div>
  );
}
