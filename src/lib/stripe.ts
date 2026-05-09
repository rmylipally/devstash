import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  return stripeClient;
}

export function getStripePriceIds() {
  return {
    proMonthly: requireEnv("STRIPE_PRICE_PRO_MONTHLY"),
    proYearly: requireEnv("STRIPE_PRICE_PRO_YEARLY"),
  } as const;
}
