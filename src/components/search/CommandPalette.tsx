"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Code2, File, Folder, Image, Link as LinkIcon, Sparkles, StickyNote, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getSearchableData, type SearchableItem, type SearchableCollection } from "@/actions/search";
import type { DashboardItemKind } from "@/lib/db/items";
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

const itemKindStyles: Record<DashboardItemKind, string> = {
  snippet: "bg-blue-500/10 text-blue-400",
  prompt: "bg-violet-500/10 text-violet-400",
  note: "bg-yellow-500/10 text-yellow-300",
  command: "bg-orange-500/10 text-orange-400",
  file: "bg-slate-500/10 text-slate-400",
  image: "bg-pink-500/10 text-pink-400",
  link: "bg-emerald-500/10 text-emerald-400",
};

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ isOpen, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [items, setItems] = useState<SearchableItem[]>([]);
  const [collections, setCollections] = useState<SearchableCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getSearchableData();
        setItems(data.items);
        setCollections(data.collections);
      } catch (error) {
        console.error("Error loading search data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const handleSelectItem = (itemId: string) => {
    onOpenChange(false);
    // Navigate to dashboard - drawer will open via query param
    router.push(`/dashboard?openItem=${itemId}`);
  };

  const handleSelectCollection = (collectionId: string) => {
    onOpenChange(false);
    router.push(`/collections/${collectionId}`);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24">
      <div
        className="absolute inset-0 bg-background/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl rounded-lg border border-border bg-background shadow-2xl overflow-hidden">
        <Command>
          <Command.Input
            placeholder="Search items and collections... (⌘K)"
            className="border-b border-border px-4 py-3"
          />
          <div className="max-h-[400px] overflow-y-auto">
            <Command.Empty>No results found.</Command.Empty>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                {items.length > 0 && (
                  <Command.Group heading="Items">
                    {items.map((item) => {
                      const Icon = itemKindIcons[item.type];
                      return (
                        <Command.Item
                          key={item.id}
                          value={`item-${item.id}-${item.title}${item.preview ? `-${item.preview}` : ""}`}
                          onSelect={() => handleSelectItem(item.id)}
                          className="flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-accent rounded-sm cursor-pointer text-left transition-colors"
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                itemKindStyles[item.type],
                              )}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {item.title}
                            </div>
                            {item.preview && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.preview}
                              </div>
                            )}
                          </div>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}
                {collections.length > 0 && (
                  <Command.Group heading="Collections">
                    {collections.map((collection) => (
                      <Command.Item
                        key={collection.id}
                        value={`collection-${collection.id}-${collection.name}`}
                        onSelect={() => handleSelectCollection(collection.id)}
                        className="flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-accent rounded-sm cursor-pointer transition-colors text-left"
                      >
                        <Folder className="size-4 shrink-0 text-blue-400" />
                        <div className="flex-1">
                          <div className="font-medium">{collection.name}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {collection.itemCount} item
                          {collection.itemCount !== 1 ? "s" : ""}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </div>
        </Command>
      </div>
    </div>
  );
}
