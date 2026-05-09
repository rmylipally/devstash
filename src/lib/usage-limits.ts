import { PlanTier } from "@/generated/prisma/enums";

import { isProPlan, type SessionPlan } from "@/lib/billing";

export const FREE_TIER_MAX_ITEMS = 50;
export const FREE_TIER_MAX_COLLECTIONS = 3;

export interface UsageLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  reason?: string;
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

export function normalizeSessionPlan(
  plan: SessionPlan | PlanTier | null | undefined,
): SessionPlan {
  if (plan === "pro" || plan === PlanTier.PRO) {
    return "pro";
  }

  return "free";
}

export function getItemCreationLimitResult({
  currentCount,
  plan,
}: {
  currentCount: number;
  plan: SessionPlan | PlanTier | null | undefined;
}): UsageLimitResult {
  const normalizedCount = normalizeCount(currentCount);

  if (isProPlan(plan)) {
    return {
      allowed: true,
      currentCount: normalizedCount,
      limit: FREE_TIER_MAX_ITEMS,
    };
  }

  if (normalizedCount >= FREE_TIER_MAX_ITEMS) {
    return {
      allowed: false,
      currentCount: normalizedCount,
      limit: FREE_TIER_MAX_ITEMS,
      reason: "Free plan is limited to 50 items. Upgrade to Pro for unlimited items.",
    };
  }

  return {
    allowed: true,
    currentCount: normalizedCount,
    limit: FREE_TIER_MAX_ITEMS,
  };
}

export function getCollectionCreationLimitResult({
  currentCount,
  plan,
}: {
  currentCount: number;
  plan: SessionPlan | PlanTier | null | undefined;
}): UsageLimitResult {
  const normalizedCount = normalizeCount(currentCount);

  if (isProPlan(plan)) {
    return {
      allowed: true,
      currentCount: normalizedCount,
      limit: FREE_TIER_MAX_COLLECTIONS,
    };
  }

  if (normalizedCount >= FREE_TIER_MAX_COLLECTIONS) {
    return {
      allowed: false,
      currentCount: normalizedCount,
      limit: FREE_TIER_MAX_COLLECTIONS,
      reason: "Free plan is limited to 3 collections. Upgrade to Pro for unlimited collections.",
    };
  }

  return {
    allowed: true,
    currentCount: normalizedCount,
    limit: FREE_TIER_MAX_COLLECTIONS,
  };
}

export function isProRequiredItemKind(kind: string): boolean {
  return kind === "file" || kind === "image";
}

export function getItemKindPlanAccessResult({
  kind,
  plan,
}: {
  kind: string;
  plan: SessionPlan | PlanTier | null | undefined;
}): { allowed: boolean; reason?: string } {
  if (!isProRequiredItemKind(kind)) {
    return { allowed: true };
  }

  if (isProPlan(plan)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "File and image items are available on Pro. Upgrade to continue.",
  };
}
