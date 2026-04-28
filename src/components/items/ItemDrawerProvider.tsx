"use client";

import {
  CalendarDays,
  Code2,
  Copy,
  Edit3,
  File,
  Folder,
  Image,
  Link as LinkIcon,
  Pin,
  Sparkles,
  Star,
  StickyNote,
  Tag,
  Terminal,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  DashboardItem,
  DashboardItemKind,
  ItemDetail,
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

const itemKindLabels: Record<DashboardItemKind, string> = {
  command: "Commands",
  file: "Files",
  image: "Images",
  link: "Links",
  note: "Notes",
  prompt: "Prompts",
  snippet: "Snippets",
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

type ItemDetailResponse =
  | {
      data: ItemDetail;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

interface ItemDrawerContextValue {
  openItemDrawer(itemId: string): void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

function useItemDrawer() {
  const context = useContext(ItemDrawerContext);

  if (!context) {
    throw new Error("Item drawer components must be used within ItemDrawerProvider.");
  }

  return context;
}

export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openItemDrawer = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
    setIsOpen(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      openItemDrawer,
    }),
    [openItemDrawer],
  );

  useEffect(() => {
    if (!isOpen || !selectedItemId) {
      return;
    }

    const controller = new AbortController();

    async function loadItemDetail() {
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch(`/api/items/${selectedItemId}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as ItemDetailResponse;

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.success ? "Could not load item details." : payload.error,
          );
        }

        setItemDetail(payload.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setItemDetail(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load item details.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadItemDetail();

    return () => {
      controller.abort();
    };
  }, [isOpen, selectedItemId]);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      setError(null);
      setIsLoading(false);
      setItemDetail(null);
      setSelectedItemId(null);
    }
  }

  return (
    <ItemDrawerContext.Provider value={contextValue}>
      {children}
      <Sheet onOpenChange={handleOpenChange} open={isOpen} swipeDirection="right">
        <SheetContent className="sm:max-w-[44rem]">
          <ItemDrawerContent
            error={error}
            isLoading={isLoading}
            item={itemDetail}
          />
        </SheetContent>
      </Sheet>
    </ItemDrawerContext.Provider>
  );
}

interface ItemCardProps {
  className?: string;
  item: DashboardItem;
  minHeightClassName?: string;
}

export function ItemCard({
  className,
  item,
  minHeightClassName = "min-h-36",
}: ItemCardProps) {
  const { openItemDrawer } = useItemDrawer();
  const Icon = itemKindIcons[item.kind];

  return (
    <button
      className={cn(
        "flex w-full gap-4 rounded-lg border border-l-4 border-border bg-card p-5 text-left text-card-foreground transition-colors hover:border-primary/50",
        minHeightClassName,
        itemKindAccentStyles[item.kind],
        className,
      )}
      onClick={() => openItemDrawer(item.id)}
      type="button"
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
          <h3 className="truncate text-lg font-semibold">{item.title}</h3>
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
    </button>
  );
}

export function RecentItemRow({ item }: { item: DashboardItem }) {
  const { openItemDrawer } = useItemDrawer();
  const Icon = itemKindIcons[item.kind];

  return (
    <button
      className={cn(
        "flex w-full min-w-0 items-center gap-4 border-b border-l-4 border-border px-4 py-4 text-left text-card-foreground transition-colors last:border-b-0 hover:bg-muted/40 sm:px-5",
        itemKindAccentStyles[item.kind],
      )}
      onClick={() => openItemDrawer(item.id)}
      type="button"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          itemKindStyles[item.kind],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-medium">{item.title}</h3>
          {item.isPinned ? (
            <Pin className="size-4 shrink-0 fill-muted-foreground text-muted-foreground" />
          ) : null}
          {item.isFavorite ? (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {item.description}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        <span className="rounded-md bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">
          {item.kind}
        </span>
        <span className="w-16 text-right text-sm text-muted-foreground">
          {formatShortDate(item.lastViewedAt)}
        </span>
      </div>
    </button>
  );
}

interface ItemDrawerContentProps {
  error: string | null;
  isLoading: boolean;
  item: ItemDetail | null;
}

function ItemDrawerContent({ error, isLoading, item }: ItemDrawerContentProps) {
  return (
    <>
      <div className="flex items-start gap-4 border-b border-border px-6 py-6">
        {item ? <ItemIcon item={item} /> : <SkeletonBlock className="size-20" />}
        <div className="min-w-0 flex-1">
          {item ? (
            <>
              <SheetTitle className="truncate text-2xl font-semibold tracking-tight">
                {item.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Item details for {item.title}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip>{itemKindLabels[item.kind]}</Chip>
                {item.language ? <Chip>{item.language}</Chip> : null}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <SkeletonBlock className="h-7 w-56" />
              <SkeletonBlock className="h-9 w-44" />
            </div>
          )}
        </div>
        <SheetClose
          aria-label="Close item details"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </SheetClose>
      </div>

      <ItemActionBar item={item} />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7">
        {isLoading ? <ItemDrawerSkeleton /> : null}
        {!isLoading && error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {!isLoading && !error && item ? <ItemDrawerDetails item={item} /> : null}
      </div>
    </>
  );
}

function ItemActionBar({ item }: { item: ItemDetail | null }) {
  async function handleCopy() {
    if (!item) {
      return;
    }

    const copyValue = item.content ?? item.sourceUrl ?? item.title;

    await navigator.clipboard.writeText(copyValue);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-4">
      <Button
        aria-pressed={item?.isFavorite ?? false}
        className={cn(
          "h-10 gap-2 px-3",
          item?.isFavorite && "text-yellow-400 hover:text-yellow-300",
        )}
        disabled={!item}
        type="button"
        variant="ghost"
      >
        <Star
          className={cn(
            "size-5",
            item?.isFavorite && "fill-yellow-400 text-yellow-400",
          )}
        />
        Favorite
      </Button>
      <Button
        aria-pressed={item?.isPinned ?? false}
        className="h-10 gap-2 px-3"
        disabled={!item}
        type="button"
        variant="ghost"
      >
        <Pin
          className={cn(
            "size-5",
            item?.isPinned && "fill-muted-foreground text-muted-foreground",
          )}
        />
        Pin
      </Button>
      <Button
        className="h-10 gap-2 px-3"
        disabled={!item}
        onClick={handleCopy}
        type="button"
        variant="ghost"
      >
        <Copy className="size-5" />
        Copy
      </Button>
      <Button
        className="h-10 gap-2 px-3"
        disabled={!item}
        type="button"
        variant="ghost"
      >
        <Edit3 className="size-5" />
        Edit
      </Button>
      <Button
        aria-label="Delete item"
        className="ml-auto"
        disabled={!item}
        size="icon"
        type="button"
        variant="destructive"
      >
        <Trash2 className="size-5" />
      </Button>
    </div>
  );
}

function ItemDrawerDetails({ item }: { item: ItemDetail }) {
  return (
    <div className="space-y-8">
      <DetailSection title="Description">
        <p className="text-base leading-7 text-foreground">
          {item.description ?? "No description yet."}
        </p>
      </DetailSection>

      <DetailSection title={getContentTitle(item)}>
        <ItemContent item={item} />
      </DetailSection>

      <IconSection icon={Tag} title="Tags">
        <ChipList emptyLabel="No tags yet." items={item.tags} />
      </IconSection>

      <IconSection icon={Folder} title="Collections">
        <ChipList
          emptyLabel="Not added to a collection yet."
          items={item.collections.map((collection) => collection.name)}
        />
      </IconSection>

      <IconSection icon={CalendarDays} title="Details">
        <dl className="space-y-3 text-sm">
          <DetailRow label="Created" value={formatLongDate(item.createdAt)} />
          <DetailRow label="Updated" value={formatLongDate(item.updatedAt)} />
          {item.fileSizeBytes ? (
            <DetailRow label="Size" value={formatFileSize(item.fileSizeBytes)} />
          ) : null}
          {item.mimeType ? <DetailRow label="MIME type" value={item.mimeType} /> : null}
        </dl>
      </IconSection>
    </div>
  );
}

function ItemContent({ item }: { item: ItemDetail }) {
  if (item.contentKind === "url") {
    return item.sourceUrl ? (
      <a
        className="break-all text-primary underline-offset-4 hover:underline"
        href={item.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        {item.sourceUrl}
      </a>
    ) : (
      <EmptyText>No URL saved.</EmptyText>
    );
  }

  if (item.contentKind === "file") {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">
          {item.originalFileName ?? item.storageKey ?? "File metadata"}
        </p>
        {item.storageKey ? (
          <p className="mt-2 break-all text-muted-foreground">{item.storageKey}</p>
        ) : null}
      </div>
    );
  }

  return item.content ? (
    <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-slate-950/70 p-4 text-sm leading-6 text-slate-100">
      <code>{item.content}</code>
    </pre>
  ) : (
    <EmptyText>No content saved.</EmptyText>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-6 w-full" />
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-24" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-20" />
          <SkeletonBlock className="h-9 w-24" />
          <SkeletonBlock className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function IconSection({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" />
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

function ChipList({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: string[];
}) {
  if (items.length === 0) {
    return <EmptyText>{emptyLabel}</EmptyText>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
      {children}
    </span>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function ItemIcon({ item }: { item: Pick<ItemDetail, "kind"> }) {
  const Icon = itemKindIcons[item.kind];

  return (
    <span
      className={cn(
        "flex size-20 shrink-0 items-center justify-center rounded-xl",
        itemKindStyles[item.kind],
      )}
    >
      <Icon className="size-9" />
    </span>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
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

function getContentTitle(item: ItemDetail) {
  if (item.contentKind === "url") {
    return "URL";
  }

  if (item.contentKind === "file") {
    return "File";
  }

  return "Content";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatFileSize(value: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
