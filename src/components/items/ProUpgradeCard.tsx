"use client";

import NextLink from "next/link";
import { BillingSettingsCard } from "@/components/profile/BillingSettingsCard";
import type { SessionPlan } from "@/lib/billing";

interface ProUpgradeCardProps {
  itemTypeLabel: string;
  currentPlan: SessionPlan;
}

export function ProUpgradeCard({ itemTypeLabel, currentPlan }: ProUpgradeCardProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="rounded-lg border border-border bg-card p-8 text-card-foreground">
          <p className="text-sm font-medium text-primary">Pro feature</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {itemTypeLabel} require Pro
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Upgrade your plan to browse and manage {itemTypeLabel.toLowerCase()} items.
          </p>
        </div>

        {currentPlan === "free" && (
          <BillingSettingsCard currentPlan={currentPlan} />
        )}

        <NextLink
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          href="/dashboard"
        >
          Back to dashboard
        </NextLink>
      </div>
    </div>
  );
}
