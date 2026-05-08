import { redirect } from "next/navigation";
import { Mail, ShieldCheck, User } from "lucide-react";

import { auth } from "@/auth";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { ItemCreateButton } from "@/components/items/ItemCreateDialog";
import { EditorPreferencesSettings } from "@/components/profile/EditorPreferencesSettings";
import { ProfileAccountActions } from "@/components/profile/ProfileAccountActions";
import {
  getDashboardCollectionOptions,
  getDashboardCollections,
  getFavoriteCollections,
} from "@/lib/db/collections";
import { getDashboardItemTypes } from "@/lib/db/items";
import { getProfileData } from "@/lib/db/profile";
import { currentUser } from "@/lib/mock-data";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/pagination";

export const dynamic = "force-dynamic";

function getDashboardUser(profile: {
  email: string;
  id: string;
  image?: string | null;
  name: string;
}): DashboardUser {
  return {
    email: profile.email,
    id: profile.id,
    image: profile.image ?? null,
    name: profile.name,
    plan: currentUser.plan,
  };
}

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const profile = await getProfileData({
    userEmail: session.user.email ?? undefined,
    userId: session.user.id,
  });

  if (!profile) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const [
    recentDashboardCollections,
    sidebarFavoriteCollections,
    sidebarItemTypes,
    collectionOptions,
  ] =
    await Promise.all([
      getDashboardCollections({
        limit: DASHBOARD_COLLECTIONS_LIMIT,
        userId: profile.id,
      }),
      getFavoriteCollections(profile.id),
      getDashboardItemTypes({ userId: profile.id }),
      getDashboardCollectionOptions({ userId: profile.id }),
    ]);
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = sidebarFavoriteCollections.slice(0, 4);

  return (
    <DashboardFrame
      currentUser={getDashboardUser(profile)}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      newItemAction={<ItemCreateButton availableCollections={collectionOptions} />}
      recentCollections={recentSidebarCollections}
    >
      <SettingsMain
        accountEmail={profile.email}
        accountName={profile.name}
        canChangePassword={profile.canChangePassword}
      />
    </DashboardFrame>
  );
}

function SettingsMain({
  accountEmail,
  accountName,
  canChangePassword,
}: {
  accountEmail: string;
  accountName: string;
  canChangePassword: boolean;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="text-lg text-muted-foreground">
            Everything important is on this page so you do not need to jump between screens.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Account overview">
          <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="size-4" />
              Account name
            </div>
            <p className="text-lg font-semibold">{accountName}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="size-4" />
              Account email
            </div>
            <p className="text-lg font-semibold break-all">{accountEmail}</p>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 text-card-foreground">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Security and account controls</h2>
          </div>
          <ProfileAccountActions
            accountEmail={accountEmail}
            canChangePassword={canChangePassword}
          />
        </section>

        <EditorPreferencesSettings />
      </div>
    </div>
  );
}
