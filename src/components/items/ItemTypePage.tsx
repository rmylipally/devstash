import {
  Code2,
  File,
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

import type {
  DashboardItem,
  DashboardItemKind,
  DashboardItemType,
} from "@/lib/db/items";
import { cn } from "@/lib/utils";

const itemKindIcons: Record<DashboardItemKind, LucideIcon> = {
  command: Terminal,
  file: File,
  image: Image,
  link: LinkIcon,
  note: StickyNote,
  prompt: Sparkles,
  snippet: Code2,
};

const itemKindStyles: Record<DashboardItemKind, string> = {
  command: "bg-orange-500/10 text-orange-400",
  file: "bg-slate-500/10 text-slate-400",
  image: "bg-pink-500/10 text-pink-400",
  link: "bg-emerald-500/10 text-emerald-400",
  note: "bg-yellow-500/10 text-yellow-300",
  prompt: "bg-violet-500/10 text-violet-400",
  snippet: "bg-blue-500/10 text-blue-400",
};

const itemKindAccentStyles: Record<DashboardItemKind, string> = {
  command: "border-l-orange-500",
  file: "border-l-slate-500",
  image: "border-l-pink-500",
  link: "border-l-emerald-500",
  note: "border-l-yellow-300",
  prompt: "border-l-violet-500",
  snippet: "border-l-blue-500",
};

interface ItemTypePageProps {
  itemType: DashboardItemType;
  items: DashboardItem[];
}

function formatItemCount(count: number) {
  return `${count} saved ${count === 1 ? "item" : "items"}`;
}

export function ItemTypePage({ itemType, items }: ItemTypePageProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="truncate text-4xl font-semibold tracking-tight">
              {itemType.pluralLabel}
            </h1>
            <p className="text-lg text-muted-foreground">
              {formatItemCount(items.length)}
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-card-foreground">
            <p className="text-lg font-medium">No {itemType.slug} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: DashboardItem }) {
  const Icon = itemKindIcons[item.kind];

  return (
    <NextLink
      className={cn(
        "flex min-h-36 gap-4 rounded-lg border border-l-4 border-border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50",
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
          <h2 className="truncate text-lg font-semibold">{item.title}</h2>
          {item.isPinned ? (
            <Pin className="size-4 shrink-0 fill-muted-foreground text-muted-foreground" />
          ) : null}
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

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

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
