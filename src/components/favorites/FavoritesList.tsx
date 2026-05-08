"use client";

import { Code2, File, Folder, Image, Link as LinkIcon, Sparkles, StickyNote, Terminal, type LucideIcon } from "lucide-react";
import NextLink from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItem, DashboardItemKind } from "@/lib/db/items";
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

const itemKindColors: Record<DashboardItemKind, string> = {
  snippet: "text-blue-400",
  prompt: "text-violet-400",
  note: "text-yellow-300",
  command: "text-orange-400",
  file: "text-slate-400",
  image: "text-pink-400",
  link: "text-emerald-400",
};

interface FavoritesListProps {
  collections: DashboardCollection[];
  items: DashboardItem[];
}

type FavoritesSortField = "date" | "itemType" | "name";

type FavoritesSortDirection = "asc" | "desc";

export function FavoritesList({ collections, items }: FavoritesListProps) {
  const { openItemDrawer } = useItemDrawer();
  const [sortField, setSortField] = useState<FavoritesSortField>("date");
  const [sortDirection, setSortDirection] = useState<FavoritesSortDirection>("desc");

  const handleItemClick = useCallback((item: DashboardItem) => {
    openItemDrawer(item.id);
  }, [openItemDrawer]);

  const isEmpty = items.length === 0 && collections.length === 0;

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((firstItem, secondItem) => {
      if (sortField === "name") {
        return firstItem.title.localeCompare(secondItem.title, undefined, {
          sensitivity: "base",
        });
      }

      if (sortField === "itemType") {
        const byType = firstItem.kind.localeCompare(secondItem.kind, undefined, {
          sensitivity: "base",
        });

        if (byType !== 0) {
          return byType;
        }

        return firstItem.title.localeCompare(secondItem.title, undefined, {
          sensitivity: "base",
        });
      }

      return new Date(firstItem.uploadedAt).getTime() - new Date(secondItem.uploadedAt).getTime();
    });

    if (sortDirection === "desc") {
      sorted.reverse();
    }

    return sorted;
  }, [items, sortDirection, sortField]);

  const sortedCollections = useMemo(() => {
    const sorted = [...collections].sort((firstCollection, secondCollection) => {
      if (sortField === "name") {
        return firstCollection.name.localeCompare(secondCollection.name, undefined, {
          sensitivity: "base",
        });
      }

      if (sortField === "itemType") {
        const firstType = firstCollection.dominantItemKind ?? "";
        const secondType = secondCollection.dominantItemKind ?? "";
        const byType = firstType.localeCompare(secondType, undefined, {
          sensitivity: "base",
        });

        if (byType !== 0) {
          return byType;
        }

        return firstCollection.name.localeCompare(secondCollection.name, undefined, {
          sensitivity: "base",
        });
      }

      return new Date(firstCollection.updatedAt).getTime() - new Date(secondCollection.updatedAt).getTime();
    });

    if (sortDirection === "desc") {
      sorted.reverse();
    }

    return sorted;
  }, [collections, sortDirection, sortField]);

  if (isEmpty) {
    return (
      <div className="flex min-h-100 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-6xl mb-4">★</div>
          <h2 className="text-lg font-semibold text-foreground">
            No favorites yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Star items and collections to add them to your favorites.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-8 max-w-5xl">
          <section className="rounded-lg border border-border bg-sidebar/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-mono text-muted-foreground">
                Sort favorites client-side
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="favorites-sort-field">
                  Sort favorites by
                </label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  id="favorites-sort-field"
                  onChange={(event) => setSortField(event.target.value as FavoritesSortField)}
                  value={sortField}
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="itemType">Item Type</option>
                </select>
                <button
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() =>
                    setSortDirection((currentDirection) =>
                      currentDirection === "asc" ? "desc" : "asc",
                    )
                  }
                  type="button"
                >
                  {sortDirection === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>
          </section>

          {/* Items Section */}
          {sortedItems.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-sm font-mono font-semibold text-foreground">
                  Items ({sortedItems.length})
                </h2>
              </div>
              <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-sidebar/30">
                {sortedItems.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onOpenDrawer={handleItemClick}
                    isLast={index === sortedItems.length - 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Collections Section */}
          {sortedCollections.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-sm font-mono font-semibold text-foreground">
                  Collections ({sortedCollections.length})
                </h2>
              </div>
              <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-sidebar/30">
                {sortedCollections.map((collection, index) => (
                  <CollectionRow
                    key={collection.id}
                    collection={collection}
                    isLast={index === sortedCollections.length - 1}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

interface ItemRowProps {
  item: DashboardItem;
  onOpenDrawer: (item: DashboardItem) => void;
  isLast: boolean;
}

function ItemRow({ item, onOpenDrawer, isLast }: ItemRowProps) {
  const IconComponent = itemKindIcons[item.kind];
  const iconColor = itemKindColors[item.kind];
  const formattedDate = new Date(item.uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={() => onOpenDrawer(item)}
      className={cn(
        "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors active:bg-muted",
        "flex items-center gap-3",
        !isLast && "border-b border-border"
      )}
    >
      <IconComponent className={cn("size-4 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-medium text-foreground font-mono">
            {item.title}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full shrink-0",
            "bg-muted text-muted-foreground font-mono"
          )}>
            {item.kind}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-mono shrink-0">
        {formattedDate}
      </span>
    </button>
  );
}

interface CollectionRowProps {
  collection: DashboardCollection;
  isLast: boolean;
}

function CollectionRow({ collection, isLast }: CollectionRowProps) {
  const formattedDate = new Date(collection.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <NextLink
      href={`/collections/${collection.slug}`}
      className={cn(
        "block px-4 py-3 hover:bg-muted/50 transition-colors active:bg-muted",
        "flex items-center gap-3",
        !isLast && "border-b border-border"
      )}
    >
      <Folder className="size-4 shrink-0 text-blue-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-medium text-foreground font-mono">
            {collection.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-muted text-muted-foreground font-mono">
            {collection.itemCount} item{collection.itemCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-mono shrink-0">
        {formattedDate}
      </span>
    </NextLink>
  );
}
