
import { UpgradePricingSection } from "@/components/upgrade/UpgradePricingSection";
import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import type { DashboardUser } from "@/components/dashboard/DashboardFrame";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/lib/db/profile";
import { getDashboardCollections, getFavoriteCollections, getDashboardCollectionOptions } from "@/lib/db/collections";
import { getDashboardItemTypes } from "@/lib/db/items";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/pagination";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/upgrade");
  }

  const profile = await getProfileData({
    userEmail: session.user.email ?? undefined,
    userId: session.user.id,
  });
  if (!profile) {
    redirect("/sign-in?callbackUrl=/upgrade");
  }

  function getDashboardUser(profile: { email: string; id: string; image?: string | null; name: string }, plan: "free" | "pro"): DashboardUser {
    return {
      email: profile.email,
      id: profile.id,
      image: profile.image ?? null,
      name: profile.name,
      plan,
    };
  }

  const [
    recentDashboardCollections,
    sidebarFavoriteCollections,
    sidebarItemTypes,
    collectionOptions,
  ] = await Promise.all([
    getDashboardCollections({ limit: DASHBOARD_COLLECTIONS_LIMIT, userId: profile.id }),
    getFavoriteCollections(profile.id),
    getDashboardItemTypes({ userId: profile.id }),
    getDashboardCollectionOptions({ userId: profile.id }),
  ]);
  const recentSidebarCollections = recentDashboardCollections.slice(0, 4);
  const favoriteCollections = sidebarFavoriteCollections.slice(0, 4);

  return (
    <DashboardFrame
      currentUser={getDashboardUser(profile, session.user.plan ?? "free")}
      favoriteCollections={favoriteCollections}
      itemTypes={sidebarItemTypes}
      newItemAction={null}
      recentCollections={recentSidebarCollections}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Upgrade to Pro</h1>
        <p className="mb-8 text-muted-foreground text-lg">Unlock unlimited items, AI features, and more. Choose your plan below.</p>
        <UpgradePricingSection />
      </div>
    </DashboardFrame>
  );
}
