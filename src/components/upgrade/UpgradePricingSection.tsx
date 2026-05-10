"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UpgradePricingSection() {
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proPrice = billingMode === "monthly" ? "$8/mo" : "$72/yr";

  async function handleUpgrade() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle: billingMode }),
      });
      const result = await response.json();
      if (!result.success || !result.data?.url) {
        setError(result.error || "Could not start checkout. Try again.");
        setIsLoading(false);
        return;
      }
      window.location.assign(result.data.url);
    } catch (e) {
      setError("Could not start checkout. Try again.");
      setIsLoading(false);
    }
  }

  return (
    <section className="py-10" id="upgrade-pricing">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-900/70 p-1">
        <button
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition",
            billingMode === "monthly" && "bg-blue-600/35 text-slate-100",
          )}
          onClick={() => setBillingMode("monthly")}
          type="button"
        >
          Monthly
        </button>
        <button
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition",
            billingMode === "yearly" && "bg-blue-600/35 text-slate-100",
          )}
          onClick={() => setBillingMode("yearly")}
          type="button"
        >
          Yearly
        </button>
        <span className="pr-2 text-xs text-slate-400">Yearly saves $24</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5">
          <h3 className="text-xl font-semibold text-slate-100">Free</h3>
          <p className="mt-1 text-4xl font-bold text-slate-100">$0</p>
          <p className="text-sm text-slate-400">Forever</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>Up to 50 items</li>
            <li>3 collections</li>
            <li>Core search</li>
          </ul>
        </article>
        <article className="relative rounded-2xl border border-indigo-400/70 bg-slate-900/80 p-5 shadow-2xl shadow-indigo-950/40">
          <p className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 font-mono text-xs text-slate-50">
            Most Popular
          </p>
          <h3 className="text-xl font-semibold text-slate-100">Pro</h3>
          <p className="mt-1 text-4xl font-bold text-slate-100">{proPrice}</p>
          <p className="text-sm text-slate-400">Unlimited everything</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>Unlimited items and collections</li>
            <li>AI tags and summaries</li>
            <li>Priority support</li>
          </ul>
          <Button
            className="mt-5 w-full"
            variant="default"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : `Upgrade – ${proPrice}`}
          </Button>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </article>
      </div>
    </section>
  );
}
