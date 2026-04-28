"use client";

import {
  ChevronUp,
  Code2,
  File,
  Folder,
  Image,
  Layers3,
  Link as LinkIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  Star,
  StickyNote,
  Terminal,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import NextLink from "next/link";
import { useState, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DashboardCollection } from "@/lib/db/collections";
import type {
  DashboardItemKind,
  DashboardItemType,
} from "@/lib/db/items";
import type { PlanTier } from "@/lib/mock-data";
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

const proItemKinds = new Set<DashboardItemKind>(["file", "image"]);

interface DashboardFrameProps {
  children: ReactNode;
  currentUser: DashboardUser;
  favoriteCollections: DashboardCollection[];
  itemTypes: DashboardItemType[];
  newItemAction?: ReactNode;
  recentCollections: DashboardCollection[];
}

export interface DashboardUser {
  email: string;
  id: string;
  image?: string | null;
  name: string;
  plan: PlanTier;
}

export function DashboardFrame({
  children,
  currentUser,
  favoriteCollections,
  itemTypes,
  newItemAction,
  recentCollections,
}: DashboardFrameProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "hidden min-h-dvh shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
            isCollapsed ? "w-20" : "w-72",
          )}
        >
          <SidebarContent
            collapsed={isCollapsed}
            currentUser={currentUser}
            favoriteCollections={favoriteCollections}
            itemTypes={itemTypes}
            recentCollections={recentCollections}
          />
        </aside>

        {isMobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Close sidebar"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
              type="button"
            />
            <aside className="relative z-10 flex h-full w-[min(88vw,320px)] flex-col border-r border-border bg-sidebar shadow-2xl">
              <SidebarContent
                collapsed={false}
                currentUser={currentUser}
                favoriteCollections={favoriteCollections}
                itemTypes={itemTypes}
                mobile
                onClose={() => setIsMobileOpen(false)}
                recentCollections={recentCollections}
              />
            </aside>
          </div>
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between gap-4 border-b border-border px-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                aria-label="Open sidebar"
                className="md:hidden"
                onClick={() => setIsMobileOpen(true)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <PanelLeftOpen className="size-5" />
              </Button>

              <Button
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
                className="hidden md:inline-flex"
                onClick={() => setIsCollapsed((current) => !current)}
                size="icon"
                type="button"
                variant="ghost"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="size-5" />
                ) : (
                  <PanelLeftClose className="size-5" />
                )}
              </Button>

              <div className="relative min-w-0 flex-1 md:max-w-2xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search items"
                  className="h-11 rounded-lg bg-muted/40 pl-10 text-base"
                  placeholder="Search items..."
                  readOnly
                  type="search"
                />
              </div>
            </div>

            {newItemAction ?? (
              <Button className="h-11 gap-2 px-4" type="button">
                <Plus className="size-5" />
                <span className="hidden sm:inline">New Item</span>
              </Button>
            )}
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  currentUser: DashboardUser;
  favoriteCollections: DashboardCollection[];
  itemTypes: DashboardItemType[];
  mobile?: boolean;
  onClose?: () => void;
  recentCollections: DashboardCollection[];
}

function SidebarContent({
  collapsed,
  currentUser,
  favoriteCollections,
  itemTypes,
  mobile = false,
  onClose,
  recentCollections,
}: SidebarContentProps) {
  return (
    <div className="flex min-h-0 w-full flex-col">
      <div
        className={cn(
          "flex h-20 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <NextLink
          className={cn(
            "flex min-w-0 items-center gap-3",
            collapsed && "justify-center",
          )}
          href="/dashboard"
          onClick={onClose}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers3 className="size-5" />
          </span>
          {!collapsed ? (
            <span className="truncate text-xl font-semibold tracking-tight">
              DevStash
            </span>
          ) : null}
        </NextLink>

        {mobile ? (
          <Button
            aria-label="Close sidebar"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-5" />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <SidebarSection collapsed={collapsed} title="Types">
          {itemTypes.map((itemType) => {
            const Icon = itemKindIcons[itemType.id];

            return (
              <NextLink
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
                href={`/items/${itemType.slug}`}
                key={itemType.id}
                onClick={onClose}
                title={collapsed ? itemType.pluralLabel : undefined}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    itemKindStyles[itemType.id],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      {itemType.pluralLabel}
                    </span>
                    {proItemKinds.has(itemType.id) ? (
                      <Badge
                        className="h-5 border-sidebar-border bg-sidebar-accent/60 px-1.5 text-[10px] font-semibold text-muted-foreground"
                        variant="outline"
                      >
                        PRO
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {itemType.count}
                    </span>
                  </>
                ) : null}
              </NextLink>
            );
          })}
        </SidebarSection>

        <SidebarSection collapsed={collapsed} title="Favorites">
          {favoriteCollections.map((collection) => (
            <CollectionLink
              collapsed={collapsed}
              collection={collection}
              key={collection.id}
              onNavigate={onClose}
              showStar
            />
          ))}
        </SidebarSection>

        <SidebarSection collapsed={collapsed} title="Recent">
          {recentCollections.map((collection) => (
            <CollectionLink
              collapsed={collapsed}
              collection={collection}
              key={collection.id}
              onNavigate={onClose}
            />
          ))}
          <ViewAllCollectionsLink collapsed={collapsed} onNavigate={onClose} />
        </SidebarSection>
      </div>

      <UserFooter collapsed={collapsed} currentUser={currentUser} />
    </div>
  );
}

interface SidebarSectionProps {
  children: ReactNode;
  collapsed: boolean;
  title: string;
}

function SidebarSection({ children, collapsed, title }: SidebarSectionProps) {
  return (
    <section className="mb-7 last:mb-0">
      {!collapsed ? (
        <h2 className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      ) : (
        <h2 className="sr-only">{title}</h2>
      )}
      <div className="space-y-1">{children}</div>
    </section>
  );
}

interface CollectionLinkProps {
  collapsed: boolean;
  collection: Pick<
    DashboardCollection,
    "dominantItemKind" | "id" | "itemCount" | "name" | "slug"
  >;
  onNavigate?: () => void;
  showStar?: boolean;
}

function CollectionLink({
  collapsed,
  collection,
  onNavigate,
  showStar = false,
}: CollectionLinkProps) {
  return (
    <NextLink
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
      href={`/collections/${collection.slug}`}
      onClick={onNavigate}
      title={collapsed ? collection.name : undefined}
    >
      <CollectionLinkMarker collection={collection} showStar={showStar} />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{collection.name}</span>
          {showStar ? (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {collection.itemCount}
            </span>
          )}
        </>
      ) : null}
    </NextLink>
  );
}

interface CollectionLinkMarkerProps {
  collection: Pick<DashboardCollection, "dominantItemKind">;
  showStar: boolean;
}

function CollectionLinkMarker({
  collection,
  showStar,
}: CollectionLinkMarkerProps) {
  if (!showStar && collection.dominantItemKind) {
    return (
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          itemKindStyles[collection.dominantItemKind],
        )}
      >
        <span className="size-2.5 rounded-full bg-current" />
      </span>
    );
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
      <Folder className="size-4" />
    </span>
  );
}

interface ViewAllCollectionsLinkProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function ViewAllCollectionsLink({
  collapsed,
  onNavigate,
}: ViewAllCollectionsLinkProps) {
  return (
    <NextLink
      className={cn(
        "mt-2 flex h-10 items-center gap-3 rounded-lg px-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
      href="/collections"
      onClick={onNavigate}
      title={collapsed ? "View all collections" : undefined}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
        <Folder className="size-4" />
      </span>
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate">View all collections</span>
      ) : null}
    </NextLink>
  );
}

interface UserFooterProps {
  collapsed: boolean;
  currentUser: DashboardUser;
}

function UserFooter({ collapsed, currentUser }: UserFooterProps) {
  return (
    <div className="border-t border-sidebar-border p-3">
      {collapsed ? (
        <NextLink
          aria-label="Open profile"
          className="flex justify-center rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent"
          href="/profile"
        >
          <UserAvatar
            email={currentUser.email}
            image={currentUser.image}
            name={currentUser.name}
          />
        </NextLink>
      ) : (
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent [&::-webkit-details-marker]:hidden">
            <UserAvatar
              email={currentUser.email}
              image={currentUser.image}
              name={currentUser.name}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {currentUser.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {currentUser.email}
              </span>
            </span>
            <ChevronUp className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl">
            <NextLink
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="/profile"
            >
              <User className="size-4" />
              Profile
            </NextLink>
            <SignOutButton />
          </div>
        </details>
      )}
    </div>
  );
}
