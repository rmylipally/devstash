import { PlanTier } from "@/generated/prisma/enums";

export type BillingCycle = "monthly" | "yearly";
export type SessionPlan = "free" | "pro";

export function normalizePlanTier(plan: PlanTier | null | undefined): SessionPlan {
  return plan === PlanTier.PRO ? "pro" : "free";
}

export function isProPlan(plan: SessionPlan | PlanTier | null | undefined): boolean {
  return plan === "pro" || plan === PlanTier.PRO;
}

export function getPriceIdForCycle(
  billingCycle: BillingCycle,
  priceIds: { proMonthly: string; proYearly: string },
): string {
  return billingCycle === "yearly" ? priceIds.proYearly : priceIds.proMonthly;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "http://localhost:3000"
  );
}
