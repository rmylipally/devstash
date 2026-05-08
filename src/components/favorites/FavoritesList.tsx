"use client";

import { Code2, File, Folder, Image, Link as LinkIcon, Sparkles, StickyNote, Terminal, type LucideIcon } from "lucide-react";
import NextLink from "next/link";
import { useCallback, type ReactNode } from "react";

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

export function FavoritesList({ collections, items }: FavoritesListProps) {
  const { openItemDrawer } = useItemDrawer();

  const handleItemClick = useCallback((item: DashboardItem) => {
    openItemDrawer(item.id);
  }, [openItemDrawer]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isEmpty = items.length === 0 && collections.length === 0;

  if (isEmpty) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
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
          {/* Items Section */}
          {items.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-sm font-mono font-semibold text-foreground">
                  Items ({items.length})
                </h2>
              </div>
              <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-sidebar/30">
                {items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onOpenDrawer={handleItemClick}
                    isLast={index === items.length - 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Collections Section */}
          {collections.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-sm font-mono font-semibold text-foreground">
                  Collections ({collections.length})
                </h2>
              </div>
              <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-sidebar/30">
                {collections.map((collection, index) => (
                  <CollectionRow
                    key={collection.id}
                    collection={collection}
                    isLast={index === collections.length - 1}
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
