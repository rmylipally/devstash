"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { DashboardCollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

interface CollectionMultiSelectProps {
  availableCollections: DashboardCollectionOption[];
  label: string;
  onCollectionIdsChange(collectionIds: string[]): void;
  selectedCollectionIds: string[];
}

export function CollectionMultiSelect({
  availableCollections,
  label,
  onCollectionIdsChange,
  selectedCollectionIds,
}: CollectionMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedCollectionIdSet = useMemo(
    () => new Set(selectedCollectionIds),
    [selectedCollectionIds],
  );
  const sortedCollections = useMemo(
    () =>
      [...availableCollections].sort((firstCollection, secondCollection) =>
        firstCollection.name.localeCompare(secondCollection.name, undefined, {
          sensitivity: "base",
        }),
      ),
    [availableCollections],
  );
  const filteredCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedCollections;
    }

    return sortedCollections.filter((collection) =>
      collection.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, sortedCollections]);

  function handleCollectionToggle(collectionId: string) {
    if (selectedCollectionIdSet.has(collectionId)) {
      onCollectionIdsChange(
        selectedCollectionIds.filter(
          (selectedCollectionId) => selectedCollectionId !== collectionId,
        ),
      );
      return;
    }

    onCollectionIdsChange([...selectedCollectionIds, collectionId]);
  }

  const selectedLabel = getSelectedCollectionLabel(
    selectedCollectionIds,
    availableCollections,
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            selectedCollectionIds.length === 0 && "text-muted-foreground",
          )}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div className="rounded-lg border border-border bg-card p-2 text-card-foreground shadow-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collections"
              type="search"
              value={query}
            />
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto" role="listbox">
            {filteredCollections.length > 0 ? (
              filteredCollections.map((collection) => {
                const isSelected = selectedCollectionIdSet.has(collection.id);

                return (
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-3 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted",
                      isSelected && "bg-muted text-foreground",
                    )}
                    key={collection.id}
                    onClick={() => handleCollectionToggle(collection.id)}
                    role="option"
                    type="button"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center">
                      {isSelected ? <Check className="size-4" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {collection.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No collections found.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getSelectedCollectionLabel(
  selectedCollectionIds: string[],
  availableCollections: DashboardCollectionOption[],
) {
  if (selectedCollectionIds.length === 0) {
    return "No collections selected";
  }

  if (selectedCollectionIds.length === 1) {
    const selectedCollection = availableCollections.find(
      (collection) => collection.id === selectedCollectionIds[0],
    );

    return selectedCollection?.name ?? "1 collection selected";
  }

  return `${selectedCollectionIds.length} collections selected`;
}
