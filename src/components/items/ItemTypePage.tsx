import { ItemCard, ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import type {
  DashboardItem,
  DashboardItemType,
} from "@/lib/db/items";
import type { ReactNode } from "react";

interface ItemTypePageProps {
  action?: ReactNode;
  itemType: DashboardItemType;
  items: DashboardItem[];
}

function formatItemCount(count: number) {
  return `${count} saved ${count === 1 ? "item" : "items"}`;
}

export function ItemTypePage({ action, itemType, items }: ItemTypePageProps) {
  return (
    <ItemDrawerProvider>
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
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>

          {items.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </ItemDrawerProvider>
  );
}
