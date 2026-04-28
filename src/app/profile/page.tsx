import {
  Archive,
  CalendarDays,
  Code2,
  File,
  Folder,
  Image,
  Link as LinkIcon,
  Mail,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ProfileAccountActions } from "@/components/profile/ProfileAccountActions";
import { Badge } from "@/components/ui/badge";
import { getDashboardCollections } from "@/lib/db/collections";
import { getDashboardItemTypes } from "@/lib/db/items";
import {
  getProfileData,
  type ProfileData,
  type ProfileItemKind,
} from "@/lib/db/profile";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const itemKindIcons: Record<ProfileItemKind, LucideIcon> = {
  snippet: Code2,
  prompt: Sparkles,
  note: StickyNote,
  command: Terminal,
  file: File,
  image: Image,
  link: LinkIcon,
};

const itemKindStyles: Record<ProfileItemKind, string> = {
  snippet: "bg-blue-500/10 text-blue-400",
  prompt: "bg-violet-500/10 text-violet-400",
  note: "bg-yellow-500/10 text-yellow-300",
  command: "bg-orange-500/10 text-orange-400",
  file: "bg-slate-500/10 text-slate-400",
  image: "bg-pink-500/10 text-pink-400",
  link: "bg-emerald-500/10 text-emerald-400",
};

function formatAccountDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getUsageStats(profile: ProfileData) {
  return [
    {
      label: "Total items",
      value: profile.stats.totalItems,
      description:
        "Saved snippets, prompts, notes, commands, files, images, and links",
      icon: Archive,
    },
    {
      label: "Total collections",
      value: profile.stats.totalCollections,
      description: "Curated groups in your workspace",
      icon: Folder,
    },
  ];
}

function getProfileDashboardUser(profile: ProfileData): DashboardUser {
  return {
    email: profile.email,
    id: profile.id,
    image: profile.image,
    name: profile.name,
    plan: currentUser.plan,
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  const profile = await getProfileData({
    userEmail: session.user.email ?? undefined,
    userId: session.user.id,
  });

  if (!profile) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  const [recentDashboardCollections, sidebarItemTypes] = await Promise.all([
    getDashboardCollections({ limit: 6, userId: profile.id }),
    getDashboardItemTypes({ userId: profile.id }),
  ]);
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = recentDashboardCollections
    .filter((collection) => collection.isFavorite)
    .slice(0, 4);

  return (
    <DashboardFrame
      currentUser={getProfileDashboardUser(profile)}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      recentCollections={recentSidebarCollections}
    >
      <ProfileMain profile={profile} />
    </DashboardFrame>
  );
}

function ProfileMain({ profile }: { profile: ProfileData }) {
  const stats = getUsageStats(profile);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your account details and workspace usage.
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <UserAvatar
                className="size-16 text-lg"
                email={profile.email}
                image={profile.image}
                name={profile.name}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-3xl font-semibold tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge variant="outline">
                    {profile.canChangePassword
                      ? "Email account"
                      : "OAuth account"}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 truncate text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  {profile.email}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  Account created {formatAccountDate(profile.accountCreatedAt)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="usage-stats-title">
          <div>
            <h2 className="text-2xl font-semibold" id="usage-stats-title">
              Usage stats
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A quick read on what you have stored in DevStash.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="rounded-lg border border-border bg-card p-5 text-card-foreground"
                  key={stat.label}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="item-type-breakdown-title"
          className="space-y-4"
        >
          <div>
            <h2
              className="text-2xl font-semibold"
              id="item-type-breakdown-title"
            >
              Item type breakdown
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Counts across your snippets, prompts, notes, commands, links,
              files, and images.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {profile.itemTypes.map((itemType) => {
              const Icon = itemKindIcons[itemType.id];

              return (
                <div
                  className="rounded-lg border border-border bg-card p-4 text-card-foreground"
                  key={itemType.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md",
                        itemKindStyles[itemType.id],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="text-2xl font-semibold">
                      {itemType.count}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-medium">
                    {itemType.pluralLabel}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /items/{itemType.slug}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <ProfileAccountActions canChangePassword={profile.canChangePassword} />
      </div>
    </div>
  );
}
